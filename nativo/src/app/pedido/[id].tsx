import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AppShell } from '@/components/AppShell';
import { Box, Btn, Card, Confirm, Empty, Line, Spinner, StatusPill, Tag, Track, Txt, useToast } from '@/components/ui';
import { api, sb } from '@/lib/supabase';
import { brl, dataHora, errMsg, hora, num, PAG } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Order } from '@/lib/types';

export default function Pedido() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [o, setO] = useState<Order | null | undefined>(undefined);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb().from('orders').select('*, order_items(*), distributors(nome, cor)').eq('id', id).maybeSingle();
    setO((data as Order) ?? null);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Enquanto aguarda o Pix, confere o pagamento a cada 4 segundos
  useEffect(() => {
    if (o?.status !== 'aguardando_pagamento') return;
    const t = setInterval(async () => {
      await api('/api/pix', { query: { orderId: id } });
      load();
    }, 4000);
    return () => clearInterval(t);
  }, [o?.status, id, load]);

  // Atualizações da loja em tempo real
  useEffect(() => {
    const ch = sb().channel(`pedido-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { sb().removeChannel(ch); };
  }, [id, load]);

  async function gerarPix() {
    const r = await api('/api/pix', { body: { orderId: Number(id) } });
    if (!r.ok) toast(r.data.error ?? 'Não foi possível gerar o Pix.');
    load();
  }
  async function cancelar() {
    const { error } = await sb().rpc('cancel_order', { p_order: Number(id), p_motivo: 'Cancelado pelo cliente' });
    if (error) toast(errMsg(error)); else toast('Pedido cancelado.');
    setConfirmCancel(false);
    load();
  }
  async function copiar() {
    await Clipboard.setStringAsync(o?.pix_qr ?? '');
    toast('Código Pix copiado');
  }

  if (o === undefined) return <AppShell requireLogin head={{ title: 'Pedido', back: '/pedidos' }}><Spinner /></AppShell>;
  if (o === null) return <AppShell requireLogin head={{ title: 'Pedido', back: '/pedidos' }}><Empty>Pedido não encontrado.</Empty></AppShell>;

  return (
    <AppShell requireLogin onRefresh={load} head={{ title: `Pedido #${o.id}`, subtitle: o.distributors?.nome, color: o.distributors?.cor, back: '/pedidos' }}>
      {o.status === 'aguardando_pagamento' && (
        <Card style={{ gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Txt k="sub">Pague com Pix para enviar o pedido</Txt>
            <Text style={{ fontFamily: F.disp, fontSize: 34, color: c.ink }}>{brl(o.total)}</Text>
          </View>
          {o.pix_qr_base64 ? (
            <>
              <Image source={{ uri: `data:image/png;base64,${o.pix_qr_base64}` }} style={{ width: 220, height: 220, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 8 }} accessibilityLabel="QR code Pix" />
              <Txt k="sub" style={{ textAlign: 'center' }}>Abra o app do banco, escolha Pix › Ler QR code, ou copie o código. Vale por 30 minutos.</Txt>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.surface2, borderRadius: 10, padding: 8 }}>
                <Text selectable numberOfLines={2} style={{ flex: 1, fontFamily: F.mono, fontSize: 11, color: c.ink }}>{o.pix_qr}</Text>
                <Btn small kind="ghost" title="Copiar" onPress={copiar} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                <Txt k="sub">Esperando confirmação do banco…</Txt>
                <ActivityIndicator size="small" color={c.primary} />
              </View>
            </>
          ) : (
            <Btn kind="acc" title="Gerar QR code Pix" onPress={gerarPix} />
          )}
        </Card>
      )}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt k="sub">{dataHora(o.created_at)}</Txt>
          {o.tipo === 'resgate' ? <Tag text="Resgate" tone="rs" /> : o.canal === 'balcao' ? <Tag text="Loja física" tone="bl" /> : <StatusPill status={o.status} />}
        </View>
        {o.canal === 'app' && o.status !== 'cancelado' && o.status !== 'aguardando_pagamento' && <Track status={o.status} retirada={o.entrega === 'retirada'} />}
        {o.status === 'em_rota' && (
          <View style={{ backgroundColor: c.surface2, padding: 10, borderRadius: 10, gap: 2 }}>
            <Txt><Text style={{ fontFamily: F.bodySemi }}>{o.entregador_nome ?? 'Entregador'}</Text> está a caminho</Txt>
            <Txt>Chega por volta de <Text style={{ fontFamily: F.bodySemi }}>{hora(o.eta)}</Text></Txt>
          </View>
        )}
        {o.status === 'cancelado' && <Box tone="err">{`Pedido cancelado${o.motivo_cancelamento ? `: ${o.motivo_cancelamento}` : ''}.${o.pag_status === 'estornar' ? ' O valor do Pix será devolvido pela loja.' : ''}`}</Box>}
        {(o.order_items ?? []).map((it) => (
          <Line key={it.id} left={`${it.qty}× ${it.nome}`} right={o.tipo === 'resgate' ? '' : brl(Number(it.preco) * it.qty)} />
        ))}
        {o.tipo === 'compra' && (
          <>
            <Line left="Entrega" right={Number(o.frete) ? brl(o.frete) : 'Grátis'} />
            <Line total left="Total" right={brl(o.total)} />
            <Txt k="sub">{o.pag_status === 'pago' ? 'Pago com Pix' : o.pag_metodo ? `Pagamento: ${PAG[o.pag_metodo]}` : ''}</Txt>
          </>
        )}
        <Txt k="sub">{o.entrega === 'retirada' ? 'Retirada na loja' : o.endereco ? `Entrega: ${o.endereco.rua}${o.endereco.comp ? ', ' + o.endereco.comp : ''}, ${o.endereco.bairro}` : ''}</Txt>
        <Text style={{ fontFamily: F.bodySemi, color: o.tipo === 'resgate' ? c.bad : c.ok }}>
          {o.tipo === 'resgate' ? `−${num(o.pontos)} pts` : o.status === 'entregue' ? `+${num(o.pontos)} pts creditados` : o.status === 'cancelado' ? 'Sem pontos' : `+${num(o.pontos)} pts na entrega`}
        </Text>
      </Card>
      {['aguardando_pagamento', 'novo'].includes(o.status) && o.canal === 'app' && (
        confirmCancel
          ? <Confirm text={`Cancelar este pedido?${o.pag_status === 'pago' ? ' O Pix será devolvido pela loja.' : ''}`} no="Manter" yes="Cancelar pedido" onNo={() => setConfirmCancel(false)} onYes={cancelar} />
          : <Btn kind="danger" title="Cancelar pedido" onPress={() => setConfirmCancel(true)} />
      )}
      <Btn kind="ghost" title="Ver todos os pedidos" onPress={() => router.navigate('/pedidos')} />
    </AppShell>
  );
}
