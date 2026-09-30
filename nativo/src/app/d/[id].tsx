import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppShell, HeadPill } from '@/components/AppShell';
import { AddBtn, CartBar, ProdRow, Stepper } from '@/components/Prod';
import { Box, BoxText, Chips, Empty, Input, Spinner, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { addToCart, useCart, useEndereco } from '@/lib/cart';
import { brl, num } from '@/lib/format';
import { isOpen, openText, tierMult } from '@/lib/store';
import { F, useColors } from '@/lib/theme';
import type { Area, Distributor, Product, Wallet } from '@/lib/types';

export default function Loja() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const cart = useCart();
  const end = useEndereco();
  const [d, setD] = useState<Distributor | null | undefined>(undefined);
  const [prods, setProds] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const [dd, pp, aa, ww] = await Promise.all([
      sb().from('distributors').select('*').eq('id', id).maybeSingle(),
      sb().from('products').select('*').eq('distributor_id', id).eq('ativo', true).order('categoria').order('nome'),
      sb().from('delivery_areas').select('*').eq('distributor_id', id),
      sb().rpc('my_wallets'),
    ]);
    setD((dd.data as Distributor) ?? null);
    setProds((pp.data as Product[]) ?? []);
    setAreas((aa.data as Area[]) ?? []);
    setWallet(((ww.data as Wallet[]) ?? []).find((w) => w.distributor_id === id) ?? null);
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cats = useMemo(() => ['Todos', ...Array.from(new Set(prods.map((p) => p.categoria)))], [prods]);
  const lista = prods
    .filter((p) => (cat === 'Todos' || p.categoria === cat) && (!q.trim() || p.nome.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => Number(a.estoque <= 0) - Number(b.estoque <= 0));

  if (d === undefined) return <AppShell head={{ title: 'Loja', back: '/' }}><Spinner /></AppShell>;
  if (d === null) return <AppShell head={{ title: 'Loja', back: '/' }}><Empty>Distribuidora não encontrada.</Empty></AppShell>;

  const mult = tierMult(wallet?.nivel);
  const bairroId = end && !end.retirada ? end.bairro_id : null;
  const area = bairroId ? areas.find((a) => a.bairro_id === bairroId) : undefined;
  const itensAqui = cart.distId === d.id ? cart.items : {};
  const qn = Object.values(itensAqui).reduce((a, b) => a + b, 0);
  const qp = cart.distId === d.id ? Object.values(cart.premios ?? {}).reduce((a, b) => a + b, 0) : 0;
  const subtotal = Object.entries(itensAqui).reduce((s, [pid, qt]) => s + (prods.find((p) => p.id === pid)?.preco ?? 0) * qt, 0);

  function add(p: Product, delta: number) {
    const r = addToCart(d!.id, p.id, delta, p.estoque);
    if (r === 'limite') toast(`Só ${p.estoque} em estoque.`);
    if (r === 'trocou') toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');
  }

  const nota = (!bairroId ? `Retirada na loja: ${d.bairro}, ${d.cidade}` : area
    ? (Number(area.taxa) > 0 ? `Entrega ${brl(area.taxa)}${Number(d.frete_gratis_acima) > 0 ? `, grátis acima de ${brl(d.frete_gratis_acima)}` : ''}` : 'Entrega grátis') + ` · ${d.prazo_texto}`
    : `Não entrega em ${end && !end.retirada ? end.bairro : ''}: só retirada`) + (Number(d.pedido_minimo) > 0 ? ` · mínimo ${brl(d.pedido_minimo)}` : '');

  return (
    <AppShell
      onRefresh={load}
      head={{ title: d.nome, subtitle: openText(d), color: d.cor, back: '/', right: <HeadPill onPress={() => router.push(`/pontos/${d.id}`)}>{num(wallet?.saldo ?? 0)} pts</HeadPill> }}
      footer={qn + qp > 0 ? (
        <CartBar title="Ver carrinho" onPress={() => router.push('/carrinho')} value={qn > 0 ? brl(subtotal) : 'Troca de pontos'}
          detail={[qn > 0 ? `${qn} ${qn > 1 ? 'itens' : 'item'}` : '', qp > 0 ? `${qp} ${qp > 1 ? 'prêmios' : 'prêmio'}` : ''].filter(Boolean).join(' + ')} />
      ) : undefined}
    >
      {!isOpen(d) && <Box tone="closed"><BoxText tone="closed"><Text style={{ fontFamily: F.bodySemi }}>{openText(d)}.</Text> Você pode montar o carrinho, mas o pedido só é aceito com a loja aberta.</BoxText></Box>}
      <Box tone="note">{nota}</Box>
      <Input placeholder={`Buscar em ${d.nome}…`} value={q} onChangeText={setQ} accessibilityLabel="Buscar produto" returnKeyType="search" />
      <Chips items={cats} value={cat} onChange={setCat} />
      <View style={{ gap: 8 }}>
        {lista.length === 0 && <Empty>Nenhum produto encontrado.</Empty>}
        {lista.map((p) => {
          const qty = itensAqui[p.id] ?? 0;
          const esg = p.estoque <= 0;
          const earn = Math.floor(Number(p.preco) * Number(d.pts_por_real) * (p.pontos_dobro ? 2 : 1) * mult);
          return (
            <ProdRow key={p.id} off={esg} categoria={p.categoria} nome={p.nome}
              meta={<>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}>{p.unidade}</Text>
                {!esg && p.estoque <= 5 && <Text style={{ fontFamily: F.body, fontSize: 12, color: c.warn }}>últimas {p.estoque}</Text>}
              </>}
              price={<>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 14.5, color: c.ink }}>{brl(p.preco)}</Text>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: p.pontos_dobro ? c.accent : c.ok }}>+{num(earn)} pts{p.pontos_dobro ? ' · 2×' : ''}</Text>
              </>}
              action={esg ? <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: c.muted }}>Esgotado</Text>
                : qty ? <Stepper qty={qty} onMinus={() => add(p, -1)} onPlus={() => add(p, 1)} />
                  : <AddBtn onPress={() => add(p, 1)} label={`Adicionar ${p.nome}`} />}
            />
          );
        })}
      </View>
    </AppShell>
  );
}
