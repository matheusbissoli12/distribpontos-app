'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, Tile, useToast, Empty } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { addToCart, useEndereco, useCart } from '@/lib/cart';
import { brl, num } from '@/lib/format';
import { isOpen, openText, tierMult } from '@/lib/store';
import type { Area, Distributor, Product, Wallet } from '@/lib/types';

export default function Loja({ params }: { params: { id: string } }) {
  const toast = useToast();
  const cart = useCart();
  const end = useEndereco();
  const [d, setD] = useState<Distributor | null | undefined>(undefined);
  const [prods, setProds] = useState<Product[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const [dd, pp, aa, ww] = await Promise.all([
        sb().from('distributors').select('*').eq('id', params.id).maybeSingle(),
        sb().from('products').select('*').eq('distributor_id', params.id).eq('ativo', true).order('categoria').order('nome'),
        sb().from('delivery_areas').select('*').eq('distributor_id', params.id),
        sb().rpc('my_wallets'),
      ]);
      setD((dd.data as Distributor) ?? null);
      setProds((pp.data as Product[]) ?? []);
      setAreas((aa.data as Area[]) ?? []);
      setWallet(((ww.data as Wallet[]) ?? []).find((w) => w.distributor_id === params.id) ?? null);
    })();
  }, [params.id]);

  const cats = useMemo(() => ['Todos', ...Array.from(new Set(prods.map((p) => p.categoria)))], [prods]);
  const lista = prods
    .filter((p) => (cat === 'Todos' || p.categoria === cat) && (!q.trim() || p.nome.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => Number(a.estoque <= 0) - Number(b.estoque <= 0));

  if (d === undefined) return <AppShell><Spinner /></AppShell>;
  if (d === null) return <AppShell head={{ title: 'Loja', back: '/' }}><Empty>Distribuidora não encontrada.</Empty></AppShell>;

  const mult = tierMult(wallet?.nivel);
  const bairroId = end && !end.retirada ? end.bairro_id : null;
  const area = bairroId ? areas.find((a) => a.bairro_id === bairroId) : undefined;
  const itensAqui = cart.distId === d.id ? cart.items : {};
  const qn = Object.values(itensAqui).reduce((a, b) => a + b, 0);
  const qp = cart.distId === d.id ? Object.values(cart.premios ?? {}).reduce((a, b) => a + b, 0) : 0;
  const subtotal = Object.entries(itensAqui).reduce((s, [id, q]) => s + (prods.find((p) => p.id === id)?.preco ?? 0) * q, 0);

  function add(p: Product, delta: number) {
    const r = addToCart(d!.id, p.id, delta, p.estoque);
    if (r === 'limite') toast(`Só ${p.estoque} em estoque.`);
    if (r === 'trocou') toast('O carrinho aceita uma distribuidora por vez. Começamos um novo.');
  }

  return (
    <AppShell head={{ title: d.nome, subtitle: openText(d), color: d.cor, back: '/', right: <Link className="ptspill num" href={`/pontos/${d.id}`}>{num(wallet?.saldo ?? 0)} pts</Link> }}>
      {!isOpen(d) && <div className="closed"><b>{openText(d)}.</b> Você pode montar o carrinho, mas o pedido só é aceito com a loja aberta.</div>}
      <div className="note">
        {!bairroId ? `Retirada na loja: ${d.bairro}, ${d.cidade}` : area ? (Number(area.taxa) > 0 ? `Entrega ${brl(area.taxa)}${Number(d.frete_gratis_acima) > 0 ? `, grátis acima de ${brl(d.frete_gratis_acima)}` : ''}` : 'Entrega grátis') + ` · ${d.prazo_texto}` : `Não entrega em ${end && !end.retirada ? end.bairro : ''}: só retirada`}
        {Number(d.pedido_minimo) > 0 ? ` · mínimo ${brl(d.pedido_minimo)}` : ''}
      </div>
      <input className="search" type="search" placeholder={`Buscar em ${d.nome}…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar produto" />
      <div className="chips">{cats.map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="list">
        {lista.length === 0 && <Empty>Nenhum produto encontrado.</Empty>}
        {lista.map((p) => {
          const qty = itensAqui[p.id] ?? 0;
          const esg = p.estoque <= 0;
          const earn = Math.floor(Number(p.preco) * Number(d.pts_por_real) * (p.pontos_dobro ? 2 : 1) * mult);
          return (
            <div key={p.id} className={`prod ${esg ? 'off' : ''}`}>
              <Tile categoria={p.categoria} />
              <div>
                <div className="pname">{p.nome}</div>
                <div className="pmeta"><span>{p.unidade}</span>{!esg && p.estoque <= 5 && <span style={{ color: 'var(--warn)' }}>últimas {p.estoque}</span>}</div>
                <div className="price num">{brl(p.preco)} <span className={`earn ${p.pontos_dobro ? 'dbl' : ''}`} style={{ fontSize: 12 }}>+{num(earn)} pts{p.pontos_dobro ? ' · 2×' : ''}</span></div>
              </div>
              {esg ? <span className="esg">Esgotado</span> : qty ? (
                <div className="step">
                  <button onClick={() => add(p, -1)} aria-label="Remover um">−</button>
                  <span className="num">{qty}</span>
                  <button onClick={() => add(p, 1)} aria-label="Adicionar um">+</button>
                </div>
              ) : (
                <button className="addbtn" onClick={() => add(p, 1)} aria-label={`Adicionar ${p.nome}`}>+</button>
              )}
            </div>
          );
        })}
      </div>
      {qn + qp > 0 && (
        <Link className="cartbar" href="/carrinho">
          <span>Ver carrinho<small>{qn > 0 && `${qn} ${qn > 1 ? 'itens' : 'item'}`}{qn > 0 && qp > 0 && ' + '}{qp > 0 && `${qp} ${qp > 1 ? 'prêmios' : 'prêmio'}`}</small></span>
          <span className="num">{qn > 0 ? brl(subtotal) : 'Troca de pontos'}</span>
        </Link>
      )}
    </AppShell>
  );
}
