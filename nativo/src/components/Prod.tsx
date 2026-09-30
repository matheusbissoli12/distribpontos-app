import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { F, useColors } from '@/lib/theme';
import { Tile } from './ui';

/** Linha de produto/prêmio (loja e carrinho). */
export function ProdRow({ categoria, gift, nome, meta, price, action, off }: {
  categoria: string; gift?: boolean; nome: string; meta?: ReactNode; price: ReactNode; action: ReactNode; off?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center', backgroundColor: c.surface, borderRadius: 12, padding: 10, opacity: off ? 0.6 : 1 }}>
      <Tile categoria={categoria} gift={gift} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 13.5, color: c.ink }}>{nome}</Text>
        {meta && <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{meta}</View>}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>{price}</View>
      </View>
      {action}
    </View>
  );
}

export function Stepper({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  const c = useColors();
  const b = (t: string, f: () => void, label: string) => (
    <Pressable onPress={f} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={{ width: 32, height: 34, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 19, color: c.primary, fontFamily: F.bodySemi }}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, borderRadius: 10, borderWidth: 1, borderColor: c.line }}>
      {b('−', onMinus, 'Remover um')}
      <Text style={{ minWidth: 22, textAlign: 'center', fontFamily: F.bodySemi, color: c.ink }}>{qty}</Text>
      {b('+', onPlus, 'Adicionar um')}
    </View>
  );
}

export function AddBtn({ onPress, label }: { onPress: () => void; label: string }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
      <Text style={{ color: c.primaryInk, fontSize: 21, fontFamily: F.bodyMed, lineHeight: 24 }}>+</Text>
    </Pressable>
  );
}

/** Barra laranja fixa "Ver carrinho". */
export function CartBar({ title, detail, value, onPress }: { title: string; detail: string; value: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({
        width: '100%', maxWidth: 536, backgroundColor: c.accent, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.9 : 1,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
      })}>
      <View>
        <Text style={{ color: '#fff', fontFamily: F.bodySemi, fontSize: 14.5 }}>{title}</Text>
        <Text style={{ color: '#fff', opacity: 0.92, fontFamily: F.body, fontSize: 12 }}>{detail}</Text>
      </View>
      <Text style={{ color: '#fff', fontFamily: F.bodySemi, fontSize: 15 }}>{value}</Text>
    </Pressable>
  );
}
