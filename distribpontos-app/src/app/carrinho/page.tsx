'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell, useAddressSheet } from '@/components/AppShell';
import { Spinner, Tile, useToast, Empty } from '@/components/ui';
import { useSession } from '@/components/useSession';
import { sb } from '@/lib/supabase/client';
import { addRewardToCart, addToCart, clearCart, useEndereco, useCart } from '@/lib/cart';
import { brl, errMsg, num, PAG } from '@/lib/format';
import { freteFor, isOpen, openText, tierMult } from '@/lib/store';
import type { Area, Distributor, Product, Reward, Wallet } from '@/lib/types';

const NENHUM = ['00000000-0000-0000-0000-000000000000'];

export default function Carrinho() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile } = useSession();
  const cart = useCart();
  const end = useEndereco();
  const addr = useAddressSheet();
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
  useEffect(() => { if (!area) setEntrega('retirada'); else setEntrega('entrega'); }, [area?.bairro_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <AppShell head={{ title: 'Carrinho', back: '/' }}><Spinner /></AppShell>;
  const itens = Object.entries(cart.items).map(([id, qty]) => ({ p: prods.find((x) => x.id === id), qty })).filter((x) => x.p) as { p: Product; qty: number }[];
  const premios = Object.entries(cart.premios ?? {}).map(([id, qty]) => ({ r: rewards.find((x) => x.id === id), qty })).filter((x) => x.r && x.r.ativo) as { r: Reward; qty: number }[];
  if (!d || (!itens.length && !premios.length))
    return (
      <AppShell head={{ title: 'Carrinho', back: '/' }}>
        <Empty>Seu carrinho está vazio.<br /><br /><Link className="btn ghost" href="/">Ver distribuidoras</Link></Empty>
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
    if (!user) return router.push('/entrar?next=/carrinho');
    if (!profile?.cpf) return router.push('/cadastro?next=/carrinho');
    if (entrega === 'entrega' && (!end || end.retirada)) return addr.show();
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
      const r = await fetch('/api/pix', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); toast(j.error ?? 'Não foi possível gerar o Pix.'); }
    }
    clearCart();
    router.replace(`/pedido/${orderId}`);
  }

  return (
    <AppShell head={{ title: 'Carrinho', subtitle: d.nome, color: d.cor, back: `/d/${d.id}` }}>
      {itens.length > 0 && (
        <div className="list">
          {itens.map(({ p, qty }) => (
            <div key={p.id} className="prod">
              <Tile categoria={p.categoria} />
              <div>
                <div className="pname">{p.nome}</div>
                <div className="pmeta"><span>{p.unidade}</span>{p.estoque < qty && <span style={{ color: 'var(--bad)' }}>só {p.estoque} em estoque</span>}</div>
                <div className="price num">{brl(Number(p.preco) * qty)}</div>
              </div>
              <div className="step">
                <button onClick={() => addToCart(d.id, p.id, -1, p.estoque)} aria-label="Remover um">−</button>
                <span className="num">{qty}</span>
                <button onClick={() => { if (addToCart(d.id, p.id, 1, p.estoque) === 'limite') toast(`Só ${p.estoque} em estoque.`); }} aria-label="Adicionar um">+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {premios.length > 0 && (
        <>
          {!soPremios && <p className="sec" style={{ margin: '4px 0 -4px' }}>Prêmios com pontos</p>}
          <div className="list">
            {premios.map(({ r, qty }) => (
              <div key={r.id} className="prod">
                <Tile categoria={r.categoria} gift />
                <div>
                  <div className="pname">{r.nome}</div>
                  <div className="pmeta"><span className="tag rs">Prêmio</span></div>
                  <div className="price num"><span className="minus">{num(r.custo * qty)} pts</span></div>
                </div>
                <div className="step">
                  <button onClick={() => addRewardToCart(d.id, r.id, -1)} aria-label="Remover um">−</button>
                  <span className="num">{qty}</span>
                  <button onClick={() => { if (ptsPremios + r.custo > saldo) toast('Seus pontos não dão para mais um.'); else addRewardToCart(d.id, r.id, 1); }} aria-label="Adicionar um">+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="card">
        <div className="sub" style={{ fontWeight: 600, color: 'var(--ink)' }}>Receber como</div>
        <div className="opts">
          <button className={`opt ${entrega === 'entrega' ? 'on' : ''}`} disabled={!area} onClick={() => setEntrega('entrega')}>
            Entrega<small>{area ? `${soPremios ? 'Sem custo' : fr ? brl(fr) : 'Grátis'} · ${d.prazo_texto}` : bairroId ? 'Fora da área' : 'Informe o endereço'}</small>
          </button>
          <button className={`opt ${entrega === 'retirada' ? 'on' : ''}`} onClick={() => setEntrega('retirada')}>Retirar na loja<small>{d.bairro}</small></button>
        </div>
        {(!end || end.retirada) && <button className="btn ghost" style={{ marginTop: 8 }} onClick={addr.show}>Informar endereço de entrega</button>}
        {entrega === 'entrega' && end && !end.retirada && (
          <p className="sub" style={{ margin: '8px 0 0' }}>Entregar em: {end.rua}{end.comp ? ` · ${end.comp}` : ''}, {end.bairro} <button className="sub" style={{ textDecoration: 'underline' }} onClick={addr.show}>alterar</button></p>
        )}
        {!soPremios && (
          <>
            <div className="sub" style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 12 }}>Pagamento</div>
            <div className="opts">
              {(['pix', 'cartao', 'dinheiro'] as const).map((k) => (
                <button key={k} className={`opt ${pag === k ? 'on' : ''}`} disabled={k === 'pix' && !d.pix_ativo} onClick={() => setPag(k)}>
                  {PAG[k]}<small>{k === 'pix' ? (d.pix_ativo ? 'Pague agora pelo app' : 'Indisponível nesta loja') : k === 'cartao' ? 'Maquininha na entrega' : 'Informe o troco ao entregador'}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="card num">
        {!soPremios && (
          <>
            <div className="line"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="line"><span>Entrega</span><span>{frete ? brl(frete) : 'Grátis'}</span></div>
          </>
        )}
        {premios.length > 0 && (
          <>
            <div className="line"><span>Seu saldo nesta loja</span><span>{num(saldo)} pts</span></div>
            <div className="line"><span>Prêmios</span><span className="minus">−{num(ptsPremios)} pts</span></div>
          </>
        )}
        {soPremios
          ? <div className="line total"><span>Saldo depois da troca</span><span>{num(saldo - ptsPremios)} pts</span></div>
          : <div className="line total"><span>Total</span><span>{brl(subtotal + frete)}</span></div>}
      </div>
      {!soPremios && <div className="gain">Você ganha <b className="num">+{num(pts)} pontos</b>{mult > 1 ? ` (bônus ${wallet?.nivel})` : ''}. Os pontos entram quando o pedido for entregue.</div>}
      {semPontos && <div className="err">Faltam {num(ptsPremios - saldo)} pts para os prêmios do carrinho. Tire um prêmio para continuar.</div>}
      {abaixo && <div className="alert">Faltam {brl(Number(d.pedido_minimo) - subtotal)} para o pedido mínimo desta loja.</div>}
      {!soPremios && !aberta && <div className="closed">{openText(d)}. Volte no horário de funcionamento.</div>}
      {indisponivel.length > 0 && <div className="err">Ajuste as quantidades: alguns itens não têm estoque suficiente.</div>}
      {soPremios && <Link className="btn ghost" href={`/d/${d.id}`}>Levar produtos junto</Link>}
      <button className="btn acc" disabled={bloqueado} onClick={enviar}>
        {busy ? 'Enviando…' : soPremios ? `Confirmar troca · ${num(ptsPremios)} pts` : `${pag === 'pix' ? 'Pagar com Pix' : 'Enviar pedido'} · ${brl(subtotal + frete)}`}
      </button>
      {addr.node}
    </AppShell>
  );
}
