import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/components/session';
import { Btn, Card, Empty, Spinner, TierPill, Tile, Txt, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { addRewardToCart, useCart } from '@/lib/cart';
import { brl, dataHora, num } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Distributor, Reward, Wallet } from '@/lib/types';

type Mov = { id: number; pts: number; descricao: string; created_at: string };

export default function Carteira() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const cart = useCart();
  const { profile } = useSession();
  const [d, setD] = useState<Distributor | null>(null);
  const [w, setW] = useState<Wallet | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.cpf) return;
    const [dd, ww, rr, mm] = await Promise.all([
      sb().from('distributors').select('*').eq('id', id).maybeSingle(),
      sb().rpc('my_wallets'),
      sb().from('rewards').select('*').eq('distributor_id', id).eq('ativo', true).order('custo'),
      sb().from('points_ledger').select('id, pts, descricao, created_at').eq('distributor_id', id).eq('cpf', profile.cpf).order('created_at', { ascending: false }).limit(60),
    ]);
    setD((dd.data as Distributor) ?? null);
    setW(((ww.data as Wallet[]) ?? []).find((x) => x.distributor_id === id) ?? null);
    setRewards((rr.data as Reward[]) ?? []);
    setMovs((mm.data as Mov[]) ?? []);
    setLoaded(true);
  }, [id, profile?.cpf]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!loaded) return <AppShell requireLogin head={{ title: 'Pontos', back: '/pontos' }}><Spinner /></AppShell>;
  if (!d) return <AppShell requireLogin head={{ title: 'Pontos', back: '/pontos' }}><Empty>Distribuidora não encontrada.</Empty></AppShell>;

  const saldo = w?.saldo ?? 0;
  const acum = w?.acumulado_12m ?? 0;
  const nivel = w?.nivel ?? 'Bronze';
  const next = nivel === 'Bronze' ? { n: 'Prata', base: 0, alvo: d.nivel_prata } : nivel === 'Prata' ? { n: 'Ouro', base: d.nivel_prata, alvo: d.nivel_ouro } : null;
  const pct = next ? Math.max(0, Math.min(100, ((acum - next.base) / (next.alvo - next.base)) * 100)) : 100;
  const noCarrinho = cart.distId === d.id ? cart.premios ?? {} : {};
  const reservado = rewards.reduce((s, r) => s + r.custo * (noCarrinho[r.id] ?? 0), 0);
  const livre = saldo - reservado;

  function trocar(r: Reward) {
    if (addRewardToCart(d!.id, r.id, 1) === 'trocou') toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');
    else toast(`${r.nome} no carrinho. Escolha entrega ou retirada e confirme a troca.`);
    router.push('/carrinho');
  }

  const wt = (s: object) => [{ color: '#fff', fontFamily: F.body, fontSize: 12.5, opacity: 0.92 }, s];

  return (
    <AppShell requireLogin onRefresh={load} head={{ title: d.nome, subtitle: 'Seus pontos', color: d.cor, back: '/pontos' }}>
      <View style={{ backgroundColor: d.cor, borderRadius: 16, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={wt({ fontSize: 13 })}>Saldo disponível</Text>
          <TierPill nivel={nivel} />
        </View>
        <Text style={{ color: '#fff', fontFamily: F.disp, fontSize: 46, lineHeight: 48 }}>{num(saldo)}<Text style={{ fontSize: 18, fontFamily: F.dispSemi }}> pts</Text></Text>
        {(w?.pendente ?? 0) > 0 && <Text style={wt({})}>+{num(w!.pendente)} pts a creditar (pedidos em andamento)</Text>}
        {(w?.vence_30d ?? 0) > 0 && <Text style={wt({ fontFamily: F.bodySemi, opacity: 1 })}>{num(w!.vence_30d)} pts vencem nos próximos 30 dias</Text>}
        <View style={{ height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#fff' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Text style={wt({})}>{num(acum)} pts em 12 meses</Text>
          <Text style={wt({})}>{next ? `faltam ${num(next.alvo - acum)} p/ ${next.n}` : 'Nível máximo'}</Text>
        </View>
      </View>
      <Card>
        <Txt k="h2">Como funciona</Txt>
        <Txt k="sub">Cada {brl(1 / Number(d.pts_por_real))} em compras vale 1 ponto, no app ou no caixa (informe o CPF). Pontos valem {d.validade_meses} meses.</Txt>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[['1×', 'Bronze'], ['1,25×', `Prata · ${num(d.nivel_prata)}+`], ['1,5×', `Ouro · ${num(d.nivel_ouro)}+`]].map(([m, t]) => (
            <View key={t} style={{ flex: 1, backgroundColor: c.surface2, borderRadius: 10, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.disp, fontSize: 18, color: c.ink }}>{m}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 11.5, color: c.muted, textAlign: 'center' }}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <Txt k="h2">Trocar pontos</Txt>
        <Txt k="sub">O prêmio vai para o carrinho. Lá você escolhe entrega ou retirada e confirma a troca.</Txt>
        {rewards.length === 0 && <Txt k="sub">Esta distribuidora ainda não cadastrou prêmios.</Txt>}
        {rewards.map((r) => {
          const q = noCarrinho[r.id] ?? 0;
          const ok = livre >= r.custo;
          return (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line }}>
              <Tile categoria={r.categoria} size={44} gift />
              <View style={{ flex: 1 }}>
                <Txt k="b" style={{ fontSize: 13.5 }}>{r.nome}</Txt>
                <Text style={{ fontFamily: F.disp, fontSize: 17, color: c.accent }}>{num(r.custo)} <Text style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}>pts</Text></Text>
              </View>
              {q > 0
                ? <Btn small kind="ghost" title={`No carrinho · ${q}`} onPress={() => router.push('/carrinho')} />
                : <Btn small disabled={!ok} title={ok ? 'Trocar' : `Faltam ${num(r.custo - livre)}`} onPress={() => trocar(r)} />}
            </View>
          );
        })}
      </Card>
      <Card>
        <Txt k="h2">Extrato</Txt>
        {movs.length === 0 && <Txt k="sub">Sem movimentações.</Txt>}
        {movs.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 4 }}>
            <Txt style={{ flex: 1, fontSize: 13 }}><Text style={{ color: c.muted }}>{dataHora(m.created_at)}</Text> · {m.descricao}</Txt>
            <Text style={{ fontFamily: F.bodySemi, color: m.pts >= 0 ? c.ok : c.bad }}>{m.pts >= 0 ? '+' : ''}{num(m.pts)}</Text>
          </View>
        ))}
      </Card>
    </AppShell>
  );
}
