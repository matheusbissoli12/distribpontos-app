'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, Tile, TierPill, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { useSession } from '@/components/useSession';
import { addRewardToCart, useCart } from '@/lib/cart';
import { brl, dataHora, num } from '@/lib/format';
import type { Distributor, Reward, Wallet } from '@/lib/types';

type Mov = { id: number; pts: number; descricao: string; created_at: string };

export default function Carteira({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const cart = useCart();
  const { profile } = useSession();
  const [d, setD] = useState<Distributor | null>(null);
  const [w, setW] = useState<Wallet | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profile?.cpf) return;
    (async () => {
      const [dd, ww, rr, mm] = await Promise.all([
        sb().from('distributors').select('*').eq('id', params.id).maybeSingle(),
        sb().rpc('my_wallets'),
        sb().from('rewards').select('*').eq('distributor_id', params.id).eq('ativo', true).order('custo'),
        sb().from('points_ledger').select('id, pts, descricao, created_at').eq('distributor_id', params.id).eq('cpf', profile.cpf!).order('created_at', { ascending: false }).limit(60),
      ]);
      setD((dd.data as Distributor) ?? null);
      setW(((ww.data as Wallet[]) ?? []).find((x) => x.distributor_id === params.id) ?? null);
      setRewards((rr.data as Reward[]) ?? []);
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
  const noCarrinho = cart.distId === d.id ? cart.premios ?? {} : {};
  const reservado = rewards.reduce((s, r) => s + r.custo * (noCarrinho[r.id] ?? 0), 0);
  const livre = saldo - reservado;

  function trocar(r: Reward) {
    if (addRewardToCart(d!.id, r.id, 1) === 'trocou') toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');
    toast(`${r.nome} no carrinho. Escolha entrega ou retirada e confirme a troca.`);
    router.push('/carrinho');
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
        <p className="sub" style={{ margin: '2px 0 4px' }}>O prêmio vai para o carrinho. Lá você escolhe entrega ou retirada e confirma a troca.</p>
        {rewards.length === 0 && <p className="sub">Esta distribuidora ainda não cadastrou prêmios.</p>}
        {rewards.map((r) => {
          const q = noCarrinho[r.id] ?? 0;
          const ok = livre >= r.custo;
          return (
            <div key={r.id} className="prem">
              <Tile categoria={r.categoria} size={44} gift />
              <div><div className="pname">{r.nome}</div><div className="cost num">{num(r.custo)} <span className="sub" style={{ fontFamily: 'var(--body)', fontWeight: 400 }}>pts</span></div></div>
              {q > 0
                ? <Link className="sbtn soft" href="/carrinho">No carrinho · {q}</Link>
                : <button className="sbtn" disabled={!ok} onClick={() => trocar(r)}>{ok ? 'Trocar' : `Faltam ${num(r.custo - livre)}`}</button>}
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
    </AppShell>
  );
}
