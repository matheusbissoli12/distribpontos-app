import { createContext, useContext, type ReactNode } from 'react';
import { Platform, ScrollView, Text, useWindowDimensions, Vibration, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { F, useColors } from '@/lib/theme';
import type { Distributor, Member } from '@/lib/types';

export type PanelState = { d: Distributor; role: 'dono' | 'caixa' | 'entregador'; userId: string; members: Member[]; reload: () => Promise<void> };
export const PanelCtx = createContext<PanelState | null>(null);
export const usePanel = () => {
  const v = useContext(PanelCtx);
  if (!v) throw new Error('Painel sem contexto');
  return v;
};

/** true em telas largas (desktop, tablet deitado). */
export function useWide() {
  return useWindowDimensions().width >= 760;
}

/** Página da equipe (painel e admin): fundo neutro e conteúdo centralizado. */
export function PWrap({ children, max = 1100, scroll = true }: { children: ReactNode; max?: number; scroll?: boolean }) {
  const c = useColors();
  const inner = <View style={{ padding: 16, gap: 14, width: '100%', maxWidth: max, alignSelf: 'center' }}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="auto" />
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

/** Marca "DistribPontos" do painel. */
export function Brand({ suffix }: { suffix?: string }) {
  const c = useColors();
  return (
    <Text style={{ fontFamily: F.disp, fontSize: 24, color: c.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      Distrib<Text style={{ color: c.accent }}>Pontos</Text>{suffix ? ` · ${suffix}` : ''}
    </Text>
  );
}

/** Formulário que vira linha em tela larga e coluna no celular. */
export function Frm({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const wide = useWide();
  return <View style={[{ flexDirection: wide ? 'row' : 'column', gap: 10, alignItems: wide ? 'flex-end' : 'stretch', flexWrap: 'wrap' }, style]}>{children}</View>;
}
/** Célula de formulário com largura proporcional em tela larga. */
export function Cell({ children, grow = 1, min = 140 }: { children: ReactNode; grow?: number; min?: number }) {
  const wide = useWide();
  return <View style={wide ? { flexGrow: grow, flexBasis: min, minWidth: min } : undefined}>{children}</View>;
}

/** Linha de "tabela" em cartão. */
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const wide = useWide();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.line, padding: 12, gap: 10, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', flexWrap: 'wrap' }, style]}>
      {children}
    </View>
  );
}

/** Aviso sonoro de pedido novo. */
export function beep() {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([0, 300, 150, 300]);
    return;
  }
  try {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = W.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.35);
  } catch {
    /* sem áudio liberado */
  }
}
