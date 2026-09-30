import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { F, useColors } from '@/lib/theme';
import { Logo } from './ui';

/** Cartão de distribuidora (lista de lojas, carteiras de pontos, painel). */
export function DCard({ nome, cor, lines, right, onPress }: { nome: string; cor: string; lines: ReactNode[]; right?: ReactNode; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: c.surface, borderRadius: 14, padding: 12, opacity: pressed ? 0.85 : 1 })}>
      <Logo nome={nome} cor={cor} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: c.ink }} numberOfLines={1}>{nome}</Text>
        {lines.map((l, i) => typeof l === 'string' || typeof l === 'number'
          ? <Text key={i} style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}>{l}</Text>
          : <View key={i}>{l}</View>)}
      </View>
      {right}
    </Pressable>
  );
}

/** Coluna de pontos à direita do cartão. */
export function PtsCol({ value, empty }: { value?: string; empty?: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'flex-end' }}>
      {value !== undefined ? (
        <>
          <Text style={{ fontFamily: F.disp, fontSize: 20, color: c.ink, lineHeight: 22 }}>{value}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 11.5, color: c.muted }}>pts</Text>
        </>
      ) : <Text style={{ fontFamily: F.body, fontSize: 11.5, color: c.muted, textAlign: 'right' }}>{empty}</Text>}
    </View>
  );
}
