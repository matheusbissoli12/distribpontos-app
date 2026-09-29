'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { StatusPill, useToast, Empty } from '@/components/ui';
import { brl, errMsg, hora, num, PAG } from '@/lib/format';
import type { Order } from '@/lib/types';
import { usePanel } from './PanelContext';

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.35);
  } catch {
    /* navegador sem áudio liberado */
  }
}

const NEXT: Record<string, string> = { novo: 'Iniciar separação', separando: 'Despachar', em_rota: 'Confirmar entrega' };
const FILTROS: [string, string][] = [['abertos', 'Em aberto'], ['novo', 'Recebidos'], ['separando', 'Separando'], ['em_rota', 'Em rota'], ['entregue', 'Entregues'], ['cancelado', 'Cancelados']];

export default function PedidosPainel() {
  const { d, role, userId, members } = usePanel();
  const toast = useToast();
  const [lista, setLista] = useState<Order[]>([]);
  const [filtro, setFiltro] = useState(role === 'entregador' ? 'em_rota' : 'abertos');
  const [ent, setEnt] = useState<Record<number, string>>({});
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [novos, setNovos] = useState(0);
  const known = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    let q = sb().from('orders').select('*, order_items(*)').eq('distributor_id', d.id).eq('canal', 'app').neq('status', 'aguardando_pagamento')
      .order('created_at', { ascending: false }).limit(100);
    if (filtro === 'abertos') q = q.in('status', ['novo', 'separando', 'em_rota']);
    else q = q.eq('status', filtro);
    if (role === 'entregador') q = q.eq('entregador_id', userId);
    const { data } = await q;
    const l = (data as Order[]) ?? [];
    const fresh = l.filter((o) => o.status === 'novo' && known.current.size > 0 && !known.current.has(o.id)).length;
    if (fresh) { setNovos((n) => n + fresh); beep(); }
    l.forEach((o) => known.current.add(o.id));
    if (known.current.size === 0) known.current.add(-1);
    setLista(l);
  }, [d.id, filtro, role, userId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = sb().channel(`painel-${d.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `distributor_id=eq.${d.id}` }, () => load())
      .subscribe();
    const t = setInterval(load, 30000);
    return () => { sb().removeChannel(ch); clearInterval(t); };
  }, [d.id, load]);

  const entregadores = members.filter((m) => m.role === 'entregador' || m.role === 'dono');

  async function avancar(o: Order) {
    const { data, error } = await sb().rpc('advance_order', { p_order: o.id, p_entregador: o.status === 'separando' && o.entrega === 'entrega' ? ent[o.id] || entregadores[0]?.user_id || null : null });
    if (error) return toast(errMsg(error));
    toast(data === 'entregue' && o.tipo === 'compra' ? `#${o.id} entregue · ${num(o.pontos)} pts creditados` : `#${o.id}: status atualizado`);
    load();
  }
  async function cancelar(o: Order) {
    const { error } = await sb().rpc('cancel_order', { p_order: o.id, p_motivo: 'Cancelado pela loja' });
    if (error) return toast(errMsg(error));
    toast(`Pedido #${o.id} cancelado${o.pag_status === 'pago' ? '. Devolva o Pix pelo Mercado Pago.' : ''}`);
    setCancelId(null);
    load();
  }

  return (
    <>
      {novos > 0 && <button className="newpill" style={{ alignSelf: 'flex-start' }} onClick={() => { setNovos(0); setFiltro('novo'); }}>{novos} {novos > 1 ? 'pedidos novos' : 'pedido novo'}</button>}
      {role !== 'entregador' && (
        <div className="filt">{FILTROS.map(([k, t]) => <button key={k} className={`pill ${filtro === k ? 'st-em_rota' : ''}`} style={{ border: '1px solid var(--line)', padding: '5px 11px' }} onClick={() => setFiltro(k)}>{t}</button>)}</div>
      )}
      {role === 'entregador' && <div className="note">Suas entregas em rota. Confirme quando entregar: os pontos do cliente são creditados na hora.</div>}
      {lista.length === 0 && <Empty>Nenhum pedido aqui.</Empty>}
      {lista.map((o) => (
        <div key={o.id} className="orow">
          <div><b className="num">#{o.id}</b><div className="sub num">{hora(o.created_at)}</div></div>
          <div>
            <div className="who">{o.cliente_nome || 'Cliente'}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="sub">{o.cliente_celular ? o.cliente_celular.replace(/^\+?55/, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : ''}</span>
              {o.tipo === 'resgate' && <span className="tag rs">Resgate</span>}
            </div>
          </div>
          <div className="items">
            {(o.order_items ?? []).map((i) => `${i.qty}× ${i.nome}`).join(' · ')}<br />
            {o.entrega === 'retirada' ? 'Retirada na loja' : o.endereco ? `${o.endereco.rua}${o.endereco.comp ? ', ' + o.endereco.comp : ''} · ${o.endereco.bairro}` : ''}
            {o.tipo === 'compra' && <> · {o.pag_status === 'pago' ? <b style={{ color: 'var(--ok)' }}>Pix pago</b> : o.pag_metodo ? `cobrar ${PAG[o.pag_metodo]}` : ''}</>}
            {o.entregador_nome && o.status === 'em_rota' && <> · {o.entregador_nome}, chega ~{hora(o.eta)}</>}
          </div>
          <div className="val num">{o.tipo === 'resgate' ? <><b>{num(o.pontos)} pts</b><small style={{ color: 'var(--accent)' }}>troca de pontos</small></> : <><b>{brl(o.total)}</b><small>+{num(o.pontos)} pts</small></>}</div>
          <div className="acts">
            <StatusPill status={o.status} />
            {o.status === 'separando' && o.entrega === 'entrega' && role !== 'entregador' && (
              <select className="sel" value={ent[o.id] ?? entregadores[0]?.user_id ?? ''} onChange={(e) => setEnt({ ...ent, [o.id]: e.target.value })} aria-label="Entregador">
                {entregadores.map((m) => <option key={m.user_id} value={m.user_id}>{m.nome || m.email}</option>)}
              </select>
            )}
            {NEXT[o.status] && (role !== 'entregador' || o.status === 'em_rota') && (
              <button className="abtn" onClick={() => avancar(o)}>{o.status === 'separando' && o.entrega === 'retirada' ? 'Cliente retirou' : NEXT[o.status]}</button>
            )}
            {role !== 'entregador' && !['entregue', 'cancelado'].includes(o.status) && (
              cancelId === o.id ? (
                <span className="row-actions"><button className="lbtn" onClick={() => cancelar(o)}>Confirmar cancelamento</button><button className="lbtn" style={{ color: 'var(--muted)' }} onClick={() => setCancelId(null)}>Voltar</button></span>
              ) : <button className="lbtn" onClick={() => setCancelId(o.id)}>Cancelar</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
