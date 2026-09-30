import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { AddressSheet } from '@/components/AddressSheet';
import { ProdRow, Stepper } from '@/components/Prod';
import { useSession } from '@/components/session';
import { Box, BoxText, Btn, Card, Empty, Line, Spinner, Tag, Txt, useToast } from '@/components/ui';
import { api, sb } from '@/lib/supabase';
import { addRewardToCart, addToCart, clearCart, useCart, useEndereco } from '@/lib/cart';
import { brl, errMsg, num, PAG } from '@/lib/format';
import { freteFor, isOpen, openText, tierMult } from '@/lib/store';
import { F, useColors } from '@/lib/theme';
import type { Area, Distributor, Product, Reward, Wallet } from '@/lib/types';

const NENHUM = ['00000000-0000-0000-0000-000000000000'];

function Opt({ on, disabled, title, detail, onPress }: { on: boolean; disabled?: boolean; title: string; detail: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ selected: on, disabled }}
      style={{ flex: 1, minWidth: 130, borderWidth: on ? 2 : 1, borderColor: on ? c.primary : c.line, borderRadius: 10, padding: on ? 8 : 9, backgroundColor: on ? c.infoSoft : c.surface, opacity: disabled ? 0.45 : 1 }}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 13, color: c.ink }}>{title}</Text>
      <Text style={{ fontFamily: F.body, fontSize: 11.5, color: c.muted }}>{detail}</Text>
    </Pressable>
  );
}

export default function Carrinho() {
  const c = useColors();
  const toast = useToast();
  const { user, profile } = useSession();
  const cart = useCart();
  const end = useEndereco();
  const [sheet, setSheet] = useState(false);
  const [d, setD] = useState<Distributor | null>(null);
  const [prods, setProds] = useState<Product[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [entrega, setEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [pag, setPag] = useState<'pix' | 'cartao' | 'dinheiro'>('dinheiro');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!cart.distId) { setLoaded(true); return; }
    (async () => {
      const ids = Object.keys(cart.items);
      const rids = Object.keys(cart.premios ?? {});
      const [dd, pp, rr, aa, ww] = await Promise.all([
        sb().from('distributors').select('*').eq('id', cart.distId).maybeSingle(),
        sb().from('products').select('*').in('id', ids.length ? ids : NENHUM),
        sb().from('rewards').select('*').in('id', rids.length ? rids : NENHUM),
        sb().from('delivery_areas').select('*').eq('distributor_id', cart.distId),
        user ? sb().rpc('my_wallets') : Promise.resolve({ data: [] }),
      ]);
      const dist = (dd.data as Distributor) ?? null;
      setD(dist);
      setProds((pp.data as Product[]) ?? []);
      setRewards((rr.data as Reward[]) ?? []);
      setAreas((aa.data as Area[]) ?? []);
      setWallet((((ww as { data: unknown }).data as Wallet[]) ?? []).find((w) => w.distributor_id === cart.distId) ?? null);
      if (dist?.pix_ativo) setPag('pix');
      setLoaded(true);
    })();
  }, [cart.distId, cart.items, cart.premios, user]);

  const bairroId = end && !end.retirada ? end.bairro_id : null;
  const area = bairroId ? areas.find((a) => a.bairro_id === bairroId) : undefined;
  useEffect(() => { setEntrega(area ? 'entrega' : 'retirada'); }, [area?.bairro_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <AppShell head={{ title: 'Carrinho', back: '/' }}><Spinner /></AppShell>;
  const itens = Object.entries(cart.items).map(([id, qty]) => ({ p: prods.find((x) => x.id === id), qty })).filter((x) => x.p) as { p: Product; qty: number }[];
  const premios = Object.entries(cart.premios ?? {}).map(([id, qty]) => ({ r: rewards.find((x) => x.id === id), qty })).filter((x) => x.r && x.r.ativo) as { r: Reward; qty: number }[];
  if (!d || (!itens.length && !premios.length))
    return (
      <AppShell head={{ title: 'Carrinho', back: '/' }}>
        <Empty>
          <Txt k="sub" style={{ textAlign: 'center', marginBottom: 14 }}>Seu carrinho está vazio.</Txt>
          <Btn kind="ghost" title="Ver distribuidoras" onPress={() => router.navigate('/')} />
        </Empty>
      </AppShell>
    );

  const soPremios = itens.length === 0;
  const subtotal = itens.reduce((s, x) => s + Number(x.p.preco) * x.qty, 0);
  const fr = freteFor(d, area, subtotal);
  const frete = !soPremios && entrega === 'entrega' ? fr ?? 0 : 0;
  const mult = tierMult(wallet?.nivel);
  const pts = Math.floor(itens.reduce((s, x) => s + Number(x.p.preco) * x.qty * Number(d.pts_por_real) * (x.p.pontos_dobro ? 2 : 1), 0) * mult);
  const ptsPremios = premios.reduce((s, x) => s + x.r.custo * x.qty, 0);
  const saldo = wallet?.saldo ?? 0;
  const semPontos = ptsPremios > saldo;
  const abaixo = !soPremios && subtotal < Number(d.pedido_minimo);
  const aberta = isOpen(d);
  const indisponivel = itens.filter((x) => !x.p.ativo || x.p.estoque < x.qty);
  const bloqueado = busy || semPontos || (!soPremios && (abaixo || !aberta || indisponivel.length > 0));

  async function trocarPremios(orderId: number | null) {
    const endereco = entrega === 'entrega' && end && !end.retirada ? { bairro_id: end.bairro_id, rua: end.rua, comp: end.comp } : null;
    const ids: number[] = [];
    for (const { r, qty } of premios) {
      for (let i = 0; i < qty; i++) {
        const { data, error } = await sb().rpc('redeem_reward', { p_reward: r.id, p_entrega: entrega, p_endereco: endereco });
        if (error) { toast(`${r.nome}: ${errMsg(error)}`); return ids; }
        ids.push(data as number);
      }
    }
    if (ids.length) toast(orderId ? `Pedido enviado com ${ids.length > 1 ? 'os prêmios' : 'o prêmio'} (−${num(ptsPremios)} pts)` : `Troca confirmada (−${num(ptsPremios)} pts)`);
    return ids;
  }

  async function enviar() {
    if (!user) return router.push({ pathname: '/entrar', params: { next: '/carrinho' } });
    if (!profile?.cpf) return router.push({ pathname: '/cadastro', params: { next: '/carrinho' } });
    if (entrega === 'entrega' && (!end || end.retirada)) return setSheet(true);
    setBusy(true);
    if (soPremios) {
      const ids = await trocarPremios(null);
      setBusy(false);
      if (!ids.length) return;
      clearCart();
      return router.replace(ids.length === 1 ? `/pedido/${ids[0]}` : '/pedidos');
    }
    const { data, error } = await sb().rpc('place_order', {
      p_dist: d!.id,
      p_items: itens.map((x) => ({ product_id: x.p.id, qty: x.qty })),
      p_entrega: entrega,
      p_endereco: entrega === 'entrega' && end && !end.retirada ? { bairro_id: end.bairro_id, rua: end.rua, comp: end.comp } : null,
      p_pag: pag,
    });
    if (error) { setBusy(false); return toast(errMsg(error)); }
    const orderId = data as number;
    if (premios.length) await trocarPremios(orderId);
    if (pag === 'pix') {
      const r = await api('/api/pix', { body: { orderId } });
      if (!r.ok) toast(r.data.error ?? 'Não foi possível gerar o Pix.');
    }
    clearCart();
    setBusy(false);
    router.replace(`/pedido/${orderId}`);
  }

  return (
    <AppShell head={{ title: 'Carrinho', subtitle: d.nome, color: d.cor, back: `/d/${d.id}` }}>
      {itens.length > 0 && (
        <View style={{ gap: 8 }}>
          {itens.map(({ p, qty }) => (
            <ProdRow key={p.id} categoria={p.categoria} nome={p.nome}
              meta={<>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}>{p.unidade}</Text>
                {p.estoque < qty && <Text style={{ fontFamily: F.body, fontSize: 12, color: c.bad }}>só {p.estoque} em estoque</Text>}
              </>}
              price={<Text style={{ fontFamily: F.bodySemi, fontSize: 14.5, color: c.ink }}>{brl(Number(p.preco) * qty)}</Text>}
              action={<Stepper qty={qty} onMinus={() => addToCart(d.id, p.id, -1, p.estoque)}
                onPlus={() => { if (addToCart(d.id, p.id, 1, p.estoque) === 'limite') toast(`Só ${p.estoque} em estoque.`); }} />}
            />
          ))}
        </View>
      )}
      {premios.length > 0 && (
        <>
          {!soPremios && <Txt k="sec">Prêmios com pontos</Txt>}
          <View style={{ gap: 8 }}>
            {premios.map(({ r, qty }) => (
              <ProdRow key={r.id} gift categoria={r.categoria} nome={r.nome} meta={<Tag text="Prêmio" tone="rs" />}
                price={<Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: c.bad }}>{num(r.custo * qty)} pts</Text>}
                action={<Stepper qty={qty} onMinus={() => addRewardToCart(d.id, r.id, -1)}
                  onPlus={() => { if (ptsPremios + r.custo > saldo) toast('Seus pontos não dão para mais um.'); else addRewardToCart(d.id, r.id, 1); }} />}
              />
            ))}
          </View>
        </>
      )}
      <Card>
        <Txt k="b">Receber como</Txt>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Opt on={entrega === 'entrega'} disabled={!area} onPress={() => setEntrega('entrega')} title="Entrega"
            detail={area ? `${soPremios ? 'Sem custo' : fr ? brl(fr) : 'Grátis'} · ${d.prazo_texto}` : bairroId ? 'Fora da área' : 'Informe o endereço'} />
          <Opt on={entrega === 'retirada'} onPress={() => setEntrega('retirada')} title="Retirar na loja" detail={d.bairro} />
        </View>
        {(!end || end.retirada) && <Btn kind="ghost" title="Informar endereço de entrega" onPress={() => setSheet(true)} />}
        {entrega === 'entrega' && end && !end.retirada && (
          <Txt k="sub">
            Entregar em: {end.rua}{end.comp ? ` · ${end.comp}` : ''}, {end.bairro}{' '}
            <Text style={{ textDecorationLine: 'underline' }} onPress={() => setSheet(true)}>alterar</Text>
          </Txt>
        )}
        {!soPremios && (
          <>
            <Txt k="b" style={{ marginTop: 6 }}>Pagamento</Txt>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {(['pix', 'cartao', 'dinheiro'] as const).map((k) => (
                <Opt key={k} on={pag === k} disabled={k === 'pix' && !d.pix_ativo} onPress={() => setPag(k)} title={PAG[k]}
                  detail={k === 'pix' ? (d.pix_ativo ? 'Pague agora pelo app' : 'Indisponível nesta loja') : k === 'cartao' ? 'Maquininha na entrega' : 'Informe o troco ao entregador'} />
              ))}
            </View>
          </>
        )}
      </Card>
      <Card>
        {!soPremios && (
          <>
            <Line left="Subtotal" right={brl(subtotal)} />
            <Line left="Entrega" right={frete ? brl(frete) : 'Grátis'} />
          </>
        )}
        {premios.length > 0 && (
          <>
            <Line left="Seu saldo nesta loja" right={`${num(saldo)} pts`} />
            <Line left="Prêmios" right={`−${num(ptsPremios)} pts`} rightColor={c.bad} />
          </>
        )}
        {soPremios ? <Line total left="Saldo depois da troca" right={`${num(saldo - ptsPremios)} pts`} /> : <Line total left="Total" right={brl(subtotal + frete)} />}
      </Card>
      {!soPremios && (
        <Box tone="gain">
          <BoxText tone="gain">Você ganha <Text style={{ fontFamily: F.bodySemi, fontSize: 15 }}>+{num(pts)} pontos</Text>{mult > 1 ? ` (bônus ${wallet?.nivel})` : ''}. Os pontos entram quando o pedido for entregue.</BoxText>
        </Box>
      )}
      {semPontos && <Box tone="err">{`Faltam ${num(ptsPremios - saldo)} pts para os prêmios do carrinho. Tire um prêmio para continuar.`}</Box>}
      {abaixo && <Box tone="alert">{`Faltam ${brl(Number(d.pedido_minimo) - subtotal)} para o pedido mínimo desta loja.`}</Box>}
      {!soPremios && !aberta && <Box tone="closed">{`${openText(d)}. Volte no horário de funcionamento.`}</Box>}
      {indisponivel.length > 0 && <Box tone="err">Ajuste as quantidades: alguns itens não têm estoque suficiente.</Box>}
      {soPremios && <Btn kind="ghost" title="Levar produtos junto" onPress={() => router.push(`/d/${d.id}`)} />}
      <Btn kind="acc" disabled={bloqueado} onPress={enviar}
        title={busy ? 'Enviando…' : soPremios ? `Confirmar troca · ${num(ptsPremios)} pts` : `${pag === 'pix' ? 'Pagar com Pix' : 'Enviar pedido'} · ${brl(subtotal + frete)}`} />
      <AddressSheet visible={sheet} onClose={() => setSheet(false)} />
    </AppShell>
  );
}
