import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { beep, Row, usePanel, useWide } from '@/components/panel';
import { Box, Btn, Empty, LinkText, Select, StatusPill, Tag, Txt, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { brl, errMsg, hora, num, PAG } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Order } from '@/lib/types';

const NEXT: Record<string, string> = { novo: 'Iniciar separação', separando: 'Despachar', em_rota: 'Confirmar entrega' };
const FILTROS: [string, string][] = [['abertos', 'Em aberto'], ['novo', 'Recebidos'], ['separando', 'Separando'], ['em_rota', 'Em rota'], ['entregue', 'Entregues'], ['cancelado', 'Cancelados']];

export default function PedidosPainel() {
  const c = useColors();
  const wide = useWide();
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
      {novos > 0 && (
        <Pressable onPress={() => { setNovos(0); setFiltro('novo'); }} accessibilityRole="button" style={{ alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
          <Text style={{ color: '#fff', fontFamily: F.bodySemi }}>{novos} {novos > 1 ? 'pedidos novos' : 'pedido novo'}</Text>
        </Pressable>
      )}
      {role !== 'entregador' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {FILTROS.map(([k, t]) => (
            <Pressable key={k} onPress={() => setFiltro(k)} accessibilityRole="button" accessibilityState={{ selected: filtro === k }}
              style={{ borderWidth: 1, borderColor: filtro === k ? c.primary : c.line, backgroundColor: filtro === k ? c.infoSoft : c.surface, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ fontFamily: filtro === k ? F.bodySemi : F.body, fontSize: 12.5, color: filtro === k ? c.primary : c.muted }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {role === 'entregador' && <Box tone="note">Suas entregas em rota. Confirme quando entregar: os pontos do cliente são creditados na hora.</Box>}
      {lista.length === 0 && <Empty>Nenhum pedido aqui.</Empty>}
      {lista.map((o) => (
        <Row key={o.id}>
          <View style={{ minWidth: 60 }}>
            <Txt k="b">#{o.id}</Txt>
            <Txt k="sub">{hora(o.created_at)}</Txt>
          </View>
          <View style={{ minWidth: 150, flexShrink: 1 }}>
            <Txt k="b">{o.cliente_nome || 'Cliente'}</Txt>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Txt k="sub">{o.cliente_celular ? o.cliente_celular.replace(/^\+?55/, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : ''}</Txt>
              {o.tipo === 'resgate' && <Tag text="Resgate" tone="rs" />}
            </View>
          </View>
          <View style={{ flex: wide ? 1 : undefined, minWidth: 180 }}>
            <Txt style={{ fontSize: 13 }}>{(o.order_items ?? []).map((i) => `${i.qty}× ${i.nome}`).join(' · ')}</Txt>
            <Txt k="sub">
              {o.entrega === 'retirada' ? 'Retirada na loja' : o.endereco ? `${o.endereco.rua}${o.endereco.comp ? ', ' + o.endereco.comp : ''} · ${o.endereco.bairro}` : ''}
              {o.tipo === 'compra' && <> · {o.pag_status === 'pago' ? <Text style={{ fontFamily: F.bodySemi, color: c.ok }}>Pix pago</Text> : o.pag_metodo ? `cobrar ${PAG[o.pag_metodo]}` : ''}</>}
              {o.entregador_nome && o.status === 'em_rota' ? ` · ${o.entregador_nome}, chega ~${hora(o.eta)}` : ''}
            </Txt>
          </View>
          <View style={{ alignItems: wide ? 'flex-end' : 'flex-start', minWidth: 90 }}>
            {o.tipo === 'resgate' ? (
              <><Txt k="b">{num(o.pontos)} pts</Txt><Text style={{ fontFamily: F.body, fontSize: 11.5, color: c.accent }}>troca de pontos</Text></>
            ) : (
              <><Txt k="b">{brl(o.total)}</Txt><Txt k="mini">+{num(o.pontos)} pts</Txt></>
            )}
          </View>
          <View style={{ gap: 6, alignItems: wide ? 'flex-end' : 'stretch', minWidth: 170 }}>
            <StatusPill status={o.status} />
            {o.status === 'separando' && o.entrega === 'entrega' && role !== 'entregador' && (
              <Select compact label={undefined} placeholder="Entregador" value={ent[o.id] ?? entregadores[0]?.user_id ?? ''}
                onChange={(v) => setEnt({ ...ent, [o.id]: v })} options={entregadores.map((m) => ({ value: m.user_id, label: m.nome || m.email || m.user_id }))} />
            )}
            {NEXT[o.status] && (role !== 'entregador' || o.status === 'em_rota') && (
              <Btn small title={o.status === 'separando' && o.entrega === 'retirada' ? 'Cliente retirou' : NEXT[o.status]} onPress={() => avancar(o)} />
            )}
            {role !== 'entregador' && !['entregue', 'cancelado'].includes(o.status) && (
              cancelId === o.id ? (
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                  <LinkText color={c.bad} onPress={() => cancelar(o)}>Confirmar cancelamento</LinkText>
                  <LinkText onPress={() => setCancelId(null)}>Voltar</LinkText>
                </View>
              ) : <LinkText color={c.bad} onPress={() => setCancelId(o.id)}>Cancelar</LinkText>
            )}
          </View>
        </Row>
      ))}
    </>
  );
}

