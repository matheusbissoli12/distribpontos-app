'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, StatusPill, Track, useToast, Empty } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { brl, dataHora, errMsg, hora, num, PAG } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function Pedido({ params }: { params: { id: string } }) {
  const toast = useToast();
  const [o, setO] = useState<Order | null | undefined>(undefined);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb().from('orders').select('*, order_items(*), distributors(nome, cor)').eq('id', params.id).maybeSingle();
    setO((data as Order) ?? null);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  // Enquanto aguarda o Pix, confere o pagamento a cada 4 segundos
  useEffect(() => {
    if (o?.status !== 'aguardando_pagamento') return;
    const t = setInterval(async () => {
      await fetch(`/api/pix?orderId=${params.id}`).catch(() => null);
      load();
    }, 4000);
    return () => clearInterval(t);
  }, [o?.status, params.id, load]);

  // Atualizações da loja em tempo real
  useEffect(() => {
    const ch = sb().channel(`pedido-${params.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` }, () => load())
      .subscribe();
    return () => { sb().removeChannel(ch); };
  }, [params.id, load]);

  async function gerarPix() {
    const r = await fetch('/api/pix', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: Number(params.id) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) toast(j.error ?? 'Não foi possível gerar o Pix.');
    load();
  }
  async function cancelar() {
    const { error } = await sb().rpc('cancel_order', { p_order: Number(params.id), p_motivo: 'Cancelado pelo cliente' });
    if (error) toast(errMsg(error)); else toast('Pedido cancelado.');
    setConfirmCancel(false);
    load();
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(o?.pix_qr ?? ''); toast('Código Pix copiado'); } catch { toast('Selecione o código e copie.'); }
  }

  if (o === undefined) return <AppShell requireLogin head={{ title: 'Pedido', back: '/pedidos' }}><Spinner /></AppShell>;
  if (o === null) return <AppShell requireLogin head={{ title: 'Pedido', back: '/pedidos' }}><Empty>Pedido não encontrado.</Empty></AppShell>;

  return (
    <AppShell requireLogin head={{ title: `Pedido #${o.id}`, subtitle: o.distributors?.nome, color: o.distributors?.cor, back: '/pedidos' }}>
      {o.status === 'aguardando_pagamento' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="sub">Pague com Pix para enviar o pedido</div>
            <div className="num" style={{ fontFamily: 'var(--disp)', fontSize: 34, fontWeight: 700 }}>{brl(o.total)}</div>
          </div>
          {o.pix_qr_base64 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pix-img" src={`data:image/png;base64,${o.pix_qr_base64}`} alt="QR code Pix" />
              <p className="sub" style={{ textAlign: 'center', margin: 0 }}>Abra o app do banco, escolha Pix › Ler QR code, ou copie o código. Vale por 30 minutos.</p>
              <div className="copy"><code>{o.pix_qr}</code><button className="sbtn soft" onClick={copiar}>Copiar</button></div>
              <div className="eta"><span className="sub">Esperando confirmação do banco…</span><div className="spin" style={{ width: 18, height: 18 }} /></div>
            </>
          ) : (
            <button className="btn acc" onClick={gerarPix}>Gerar QR code Pix</button>
          )}
        </div>
      )}
      <div className="card ord">
        <div className="ordh"><span className="sub">{dataHora(o.created_at)}</span>{o.tipo === 'resgate' ? <span className="tag rs">Resgate</span> : o.canal === 'balcao' ? <span className="tag bl">Loja física</span> : <StatusPill status={o.status} />}</div>
        {o.canal === 'app' && o.status !== 'cancelado' && o.status !== 'aguardando_pagamento' && <Track status={o.status} retirada={o.entrega === 'retirada'} />}
        {o.status === 'em_rota' && (
          <div className="eta" style={{ background: 'var(--surface2)', padding: 10, borderRadius: 10 }}>
            <span><b>{o.entregador_nome ?? 'Entregador'}</b> está a caminho</span>
            <span>Chega por volta de <b>{hora(o.eta)}</b></span>
          </div>
        )}
        {o.status === 'cancelado' && <div className="err">Pedido cancelado{o.motivo_cancelamento ? `: ${o.motivo_cancelamento}` : ''}.{o.pag_status === 'estornar' ? ' O valor do Pix será devolvido pela loja.' : ''}</div>}
        {(o.order_items ?? []).map((it) => (
          <div key={it.id} className="line"><span>{it.qty}× {it.nome}</span><span className="num">{o.tipo === 'resgate' ? '' : brl(Number(it.preco) * it.qty)}</span></div>
        ))}
        {o.tipo === 'compra' && (
          <>
            <div className="line"><span>Entrega</span><span className="num">{Number(o.frete) ? brl(o.frete) : 'Grátis'}</span></div>
            <div className="line total"><span>Total</span><span className="num">{brl(o.total)}</span></div>
            <div className="sub">{o.pag_status === 'pago' ? 'Pago com Pix' : o.pag_metodo ? `Pagamento: ${PAG[o.pag_metodo]}` : ''}</div>
          </>
        )}
        <div className="sub">{o.entrega === 'retirada' ? 'Retirada na loja' : o.endereco ? `Entrega: ${o.endereco.rua}${o.endereco.comp ? ', ' + o.endereco.comp : ''}, ${o.endereco.bairro}` : ''}</div>
        <div className={o.tipo === 'resgate' ? 'minus' : 'earn'}>
          {o.tipo === 'resgate' ? `−${num(o.pontos)} pts` : o.status === 'entregue' ? `+${num(o.pontos)} pts creditados` : o.status === 'cancelado' ? 'Sem pontos' : `+${num(o.pontos)} pts na entrega`}
        </div>
      </div>
      {['aguardando_pagamento', 'novo'].includes(o.status) && o.canal === 'app' && (
        confirmCancel ? (
          <div className="err">Cancelar este pedido?{o.pag_status === 'pago' ? ' O Pix será devolvido pela loja.' : ''}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="sbtn" style={{ background: 'var(--surface)', color: 'var(--ink)' }} onClick={() => setConfirmCancel(false)}>Manter</button>
              <button className="sbtn" style={{ background: 'var(--bad)' }} onClick={cancelar}>Cancelar pedido</button>
            </div>
          </div>
        ) : <button className="btn ghost danger" onClick={() => setConfirmCancel(true)}>Cancelar pedido</button>
      )}
      <Link className="btn ghost" href="/pedidos" style={{ textAlign: 'center' }}>Ver todos os pedidos</Link>
    </AppShell>
  );
}
