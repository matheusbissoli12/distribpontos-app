import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { DCard, PtsCol } from '@/components/DCard';
import { useSession } from '@/components/session';
import { Box, BoxText, Empty, Spinner, TierPill, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { maskCpf, num } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Wallet } from '@/lib/types';

export default function Pontos() {
  const c = useColors();
  const { profile } = useSession();
  const [ws, setWs] = useState<Wallet[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await sb().rpc('my_wallets');
    setWs((data as Wallet[]) ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load, profile?.cpf]));
  const tot = (ws ?? []).reduce((a, w) => a + w.saldo, 0);

  return (
    <AppShell requireLogin onRefresh={load}>
      <View style={{ backgroundColor: c.primary, borderRadius: 16, padding: 16, gap: 10 }}>
        <Text style={{ color: c.primaryInk, fontFamily: F.body, fontSize: 13, opacity: 0.9 }}>Total em pontos</Text>
        <Text style={{ color: c.primaryInk, fontFamily: F.disp, fontSize: 46, lineHeight: 48 }}>
          {num(tot)}<Text style={{ fontSize: 18, fontFamily: F.dispSemi }}> pts</Text>
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Text style={{ color: c.primaryInk, fontFamily: F.body, fontSize: 12.5, opacity: 0.92 }}>em {ws?.length ?? 0} {ws?.length === 1 ? 'distribuidora' : 'distribuidoras'}</Text>
          <Text style={{ color: c.primaryInk, fontFamily: F.body, fontSize: 12.5, opacity: 0.92 }}>CPF {maskCpf(profile?.cpf ?? '')}</Text>
        </View>
      </View>
      {(ws ?? []).filter((w) => w.vence_30d > 0).map((w) => (
        <Box key={w.distributor_id} tone="alert">
          <BoxText tone="alert"><Text style={{ fontFamily: F.bodySemi }}>{num(w.vence_30d)} pts vencem nos próximos 30 dias</Text> na {w.nome}. Troque antes de perder.</BoxText>
        </Box>
      ))}
      <Txt k="sub">Cada distribuidora tem seus próprios pontos e prêmios. Toque para ver e trocar.</Txt>
      {ws === null ? <Spinner /> : ws.length === 0 ? <Empty>Você ainda não tem pontos. Faça um pedido ou informe seu CPF no caixa de uma distribuidora parceira.</Empty> : (
        <View style={{ gap: 8 }}>
          {ws.map((w) => (
            <DCard key={w.distributor_id} nome={w.nome} cor={w.cor} onPress={() => router.push(`/pontos/${w.distributor_id}`)}
              lines={[
                <View key="t" style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                  <TierPill nivel={w.nivel} />
                  {w.pendente > 0 && <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: c.ok }}>+{num(w.pendente)} a creditar</Text>}
                </View>,
              ]}
              right={<PtsCol value={num(w.saldo)} />}
            />
          ))}
        </View>
      )}
    </AppShell>
  );
}
