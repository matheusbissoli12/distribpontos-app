'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell, useAddressSheet } from '@/components/AppShell';
import { Spinner, Tile, TierPill, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { useSession } from '@/components/useSession';
import { useEndereco } from '@/lib/cart';
import { brl, dataHora, errMsg, num } from '@/lib/format';
import type { Area, Distributor, Reward, Wallet } from '@/lib/types';

type Mov = { id: number; pts: number; descricao: string; created_at: string };

export default function Carteira({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const end = useEndereco();
  const addr = useAddressSheet();
  const { profile } = useSession();
  const [d, setD] = useState<Distributor | null>(null);
  const [w, setW] = useState<Wallet | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [modo, setModo] = useState<'retirada' | 'entrega'>('retirada');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profile?.cpf) return;
    (async () => {
      const [dd, ww, rr, aa, mm] = await Promise.all([
        sb().from('distributors').select('*').eq('id', params.id).maybeSingle(),
        sb().rpc('my_wallets'),
        sb().from('rewards').select('*').eq('distributor_id', params.id).eq('ativo', true).order('custo'),
        sb().from('delivery_areas').select('*').eq('distributor_id', params.id),
        sb().from('points_ledger').select('id, pts, descricao, created_at').eq('distributor_id', params.id).eq('cpf', profile.cpf!).order('created_at', { ascending: false }).limit(60),
      ]);
      setD((dd.data as Distributor) ?? null);
      setW(((ww.data as Wallet[]) ?? []).find((x) => x.distributor_id === params.id) ?? null);
      setRewards((rr.data as Reward[]) ?? []);
      setAreas((aa.data as Area[]) ?? []);
      setMovs((mm.data as Mov[]) ?? []);
      setLoaded(true);
    })();
  }, [params.id, profile?.cpf]);

  if (!loaded) return <AppShell requireLogin head={{ title: 'Pontos', back: '/pontos' }}><Spinner /></AppShell>;
  if (!d) return <AppShell requireLogin head={{ title: 'Pontos', back: '/pontos' }}><div className="empty">Distribuidora não encontrada.</div></AppShell>;

  const saldo = w?.saldo ?? 0;
  const acum = w?.acumulado_12m ?? 0;
  const nivel = w?.nivel ?? 'Bronze';
  const next = nivel === 'Bronze' ? { n: 'Prata', base: 0, alvo: d.nivel_prata } : nivel === 'Prata' ? { n: 'Ouro', base: d.nivel_prata, alvo: d.nivel_ouro } : null;
  const pct = next ? Math.min(100, ((acum - next.base) / (next.alvo - next.base)) * 100) : 100;
  const podeEntregar = end && !end.retirada && areas.some((a) => a.bairro_id === end.bairro_id);

  async function trocar(r: Reward) {
    if (modo === 'entrega' && !podeEntregar) return addr.show();
    setBusy(true);
    const { data, error } = await sb().rpc('redeem_reward', {
      p_reward: r.id, p_entrega: modo,
      p_endereco: modo === 'entrega' && end && !end.retirada ? { bairro_id: end.bairro_id, rua: end.rua, comp: end.comp } : null,
    });
    setBusy(false);
    if (error) return toast(errMsg(error));
    toast(`Troca confirmada: ${r.nome}`);
    router.push(`/pedido/${data}`);
  }

  return (
    <AppShell requireLogin head={{ title: d.nome, subtitle: 'Seus pontos', color: d.cor, back: '/pontos' }}>
      <div className="wallet" style={{ background: d.cor, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13, opacity: 0.9 }}>Saldo disponível</span><TierPill nivel={nivel} /></div>
        <div className="big num">{num(saldo)}<small>pts</small></div>
        {(w?.pendente ?? 0) > 0 && <div style={{ fontSize: 12.5, opacity: 0.92 }}>+{num(w!.pendente)} pts a creditar (pedidos em andamento)</div>}
        {(w?.vence_30d ?? 0) > 0 && <div style={{ fontSize: 12.5, fontWeight: 600 }}>{num(w!.vence_30d)} pts vencem nos próximos 30 dias</div>}
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="meta"><span>{num(acum)} pts em 12 meses</span><span>{next ? `faltam ${num(next.alvo - acum)} p/ ${next.n}` : 'Nível máximo'}</span></div>
      </div>
      <div className="card">
        <h2 className="h2">Como funciona</h2>
        <p className="sub" style={{ margin: '4px 0 10px' }}>Cada {brl(1 / Number(d.pts_por_real))} em compras vale 1 ponto, no app ou no caixa (informe o CPF). Pontos valem {d.validade_meses} meses.</p>
        <div className="rules"><div><b>1×</b>Bronze</div><div><b>1,25×</b>Prata · {num(d.nivel_prata)}+</div><div><b>1,5×</b>Ouro · {num(d.nivel_ouro)}+</div></div>
      </div>
      <div className="card">
        <h2 className="h2">Trocar pontos</h2>
        {rewards.length === 0 && <p className="sub">Esta distribuidora ainda não cadastrou prêmios.</p>}
        {rewards.map((r) => {
          const ok = saldo >= r.custo;
          return (
            <div key={r.id} className="prem">
              <Tile categoria={r.categoria} size={44} gift />
              <div><div className="pname">{r.nome}</div><div className="cost num">{num(r.custo)} <span className="sub" style={{ fontFamily: 'var(--body)', fontWeight: 400 }}>pts</span></div></div>
              <button className="sbtn" disabled={!ok} onClick={() => setConfirm(r.id)}>{ok ? 'Trocar' : `Faltam ${num(r.custo - saldo)}`}</button>
              {confirm === r.id && (
                <div className="confirm" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <span>Trocar {num(r.custo)} pts por <b>{r.nome}</b>?</span>
                  <div className="fr">
                    <button className={`chip ${modo === 'retirada' ? 'on' : ''}`} onClick={() => setModo('retirada')}>Retirar na loja</button>
                    <button className={`chip ${modo === 'entrega' ? 'on' : ''}`} onClick={() => setModo('entrega')}>Receber em casa</button>
                  </div>
                  {modo === 'entrega' && !podeEntregar && <span className="mini">Informe um endereço que a loja atenda.</span>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="sbtn" style={{ background: 'var(--surface)', color: 'var(--ink)' }} onClick={() => setConfirm(null)}>Voltar</button>
                    <button className="sbtn ok" disabled={busy} onClick={() => trocar(r)}>Confirmar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="card">
        <h2 className="h2">Extrato</h2>
        {movs.length === 0 && <p className="sub">Sem movimentações.</p>}
        {movs.map((m) => (
          <div key={m.id} className="ext num"><span><span className="sub">{dataHora(m.created_at)}</span> · {m.descricao}</span><span className={m.pts >= 0 ? 'plus' : 'minus'}>{m.pts >= 0 ? '+' : ''}{num(m.pts)}</span></div>
        ))}
      </div>
      {addr.node}
    </AppShell>
  );
}
