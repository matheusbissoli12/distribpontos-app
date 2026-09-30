import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/components/session';
import { Card, Empty, Spinner, StatusPill, Tag, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { brl, dataHora, num } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Order } from '@/lib/types';

export default function Pedidos() {
  const c = useColors();
  const { profile } = useSession();
  const [lista, setLista] = useState<Order[] | null>(null);

  const load = useCallback(async () => {
    if (!profile?.cpf) return;
    const { data } = await sb().from('orders').select('*, order_items(*), distributors(nome, cor)').eq('cpf', profile.cpf)
      .order('created_at', { ascending: false }).limit(50);
    setLista((data as Order[]) ?? []);
  }, [profile?.cpf]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <AppShell requireLogin onRefresh={load}>
      <Txt k="h2">Meus pedidos e compras</Txt>
      {lista === null ? <Spinner /> : lista.length === 0 ? <Empty>Nenhum pedido ainda.</Empty> : lista.map((o) => (
        <Card key={o.id} onPress={() => router.push(`/pedido/${o.id}`)} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt><Text style={{ fontFamily: F.bodySemi }}>#{o.id}</Text> <Text style={{ color: c.muted, fontSize: 12.5 }}>{dataHora(o.created_at)}</Text></Txt>
            {o.canal === 'balcao' ? <Tag text="Loja física" tone="bl" /> : o.tipo === 'resgate' ? <Tag text="Resgate" tone="rs" /> : <StatusPill status={o.status} />}
          </View>
          <Txt k="b" style={{ fontSize: 13 }}>{o.distributors?.nome}</Txt>
          <Txt style={{ fontSize: 13 }} numberOfLines={2}>
            {o.canal === 'balcao' ? `Compra na loja${o.cupom ? ' · cupom ' + o.cupom : ''}` : (o.order_items ?? []).map((i) => `${i.qty}× ${i.nome}`).join(' · ')}
          </Txt>
          {o.tipo === 'resgate' ? <Text style={{ fontFamily: F.bodySemi, color: c.bad }}>−{num(o.pontos)} pts</Text> : (
            <Txt>
              <Text style={{ fontFamily: F.bodySemi }}>{brl(o.total)}</Text> ·{' '}
              <Text style={{ fontFamily: F.bodySemi, color: c.ok }}>{o.status === 'entregue' ? `+${num(o.pontos)} pts` : o.status === 'cancelado' ? 'sem pontos' : `+${num(o.pontos)} pts na entrega`}</Text>
            </Txt>
          )}
        </Card>
      ))}
    </AppShell>
  );
}
