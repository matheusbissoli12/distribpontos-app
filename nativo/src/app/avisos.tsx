import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Empty, Spinner, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { dataHora } from '@/lib/format';
import { F, useColors } from '@/lib/theme';

type N = { id: number; titulo: string; mensagem: string; lida: boolean; created_at: string };

export default function Avisos() {
  const c = useColors();
  const [l, setL] = useState<N[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await sb().from('notifications').select('*').order('created_at', { ascending: false }).limit(60);
      setL((data as N[]) ?? []);
      const ids = ((data as N[]) ?? []).filter((x) => !x.lida).map((x) => x.id);
      if (ids.length) await sb().from('notifications').update({ lida: true }).in('id', ids);
    })();
  }, []);
  return (
    <AppShell requireLogin head={{ title: 'Avisos', back: '/' }}>
      {l === null ? <Spinner /> : l.length === 0 ? <Empty>Nenhum aviso ainda.</Empty> : l.map((n) => (
        <View key={n.id} style={{ flexDirection: 'row', gap: 10, backgroundColor: n.lida ? c.surface : c.infoSoft, borderRadius: 12, padding: 12 }}>
          <View style={{ backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' }}>
            <Text style={{ color: c.primaryInk, fontFamily: F.bodySemi, fontSize: 10 }}>APP</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt k="b">{n.titulo}</Txt>
            <Txt>{n.mensagem}</Txt>
            <Txt k="mini">{dataHora(n.created_at)}</Txt>
          </View>
        </View>
      ))}
    </AppShell>
  );
}
