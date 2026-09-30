import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { STATUS } from '@/lib/format';
import { F, useColors, type Colors } from '@/lib/theme';

/* ---------- Texto ---------- */
type TxtKind = 'body' | 'sub' | 'h1' | 'h2' | 'disp' | 'mono' | 'b' | 'mini' | 'sec';
export function Txt({ k = 'body', style, children, color, numberOfLines, onPress }: {
  k?: TxtKind; style?: StyleProp<TextStyle>; children?: ReactNode; color?: string; numberOfLines?: number; onPress?: () => void;
}) {
  const c = useColors();
  const base: Record<TxtKind, TextStyle> = {
    body: { fontFamily: F.body, fontSize: 14, color: c.ink },
    b: { fontFamily: F.bodySemi, fontSize: 14, color: c.ink },
    sub: { fontFamily: F.body, fontSize: 13, color: c.muted },
    mini: { fontFamily: F.body, fontSize: 11.5, color: c.muted },
    h1: { fontFamily: F.disp, fontSize: 24, color: c.ink, textTransform: 'uppercase', letterSpacing: 0.4 },
    h2: { fontFamily: F.disp, fontSize: 19, color: c.ink, textTransform: 'uppercase', letterSpacing: 0.3 },
    disp: { fontFamily: F.disp, fontSize: 20, color: c.ink },
    mono: { fontFamily: F.mono, fontSize: 12, color: c.ink },
    sec: { fontFamily: F.bodySemi, fontSize: 11.5, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  };
  return (
    <Text style={[base[k], color ? { color } : null, style]} numberOfLines={numberOfLines} onPress={onPress}>
      {children}
    </Text>
  );
}

/* ---------- Toast ---------- */
const ToastCtx = createContext<(m: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <SafeAreaView edges={['bottom']} pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast} accessibilityLiveRegion="polite">
            <Text style={{ color: '#fff', fontFamily: F.bodyMed, fontSize: 13.5, textAlign: 'center' }}>{msg}</Text>
          </View>
        </SafeAreaView>
      )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  const c = useColors();
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <ActivityIndicator size={size} color={c.primary} accessibilityLabel="Carregando" />
    </View>
  );
}

/* ---------- Ícones ---------- */
const G: Record<string, string> = {
  can: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M7 7.5h10M7 16.5h10"/>',
  bottle: '<path d="M10 2.5h4v4l2 3V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V9.5l2-3z"/><path d="M8 13h8"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-4 0-6z"/>',
  bolt: '<path d="M13 2.5 5 14h6l-1 7.5 8-11.5h-6z"/>',
  box: '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z"/>',
  tool: '<path d="M14.5 4a4 4 0 0 0-4.8 5.2L4 15l2.5 2.5 5.8-5.7A4 4 0 0 0 17.5 7l-2.3 2.3-2-2z"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  home: '<path d="M3.5 10.5 12 4l8.5 6.5V20h-5.5v-5.5h-6V20H3.5z"/>',
  list: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.5a1.75 1.75 0 0 1 0 3.5h-2a1.75 1.75 0 0 0 0 3.5H14.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8.5h13V12M10 20.5v-5h4v5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
};
export function Icon({ name, size = 22, color }: { name: string; size?: number; color?: string }) {
  const c = useColors();
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${G[name] ?? G.box}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color ?? c.ink} />;
}

const CAT: Record<string, [string, string]> = {
  Cervejas: ['can', '#C4870F'], Refrigerantes: ['bottle', '#C23B2E'], 'Águas': ['drop', '#2A7DB5'], 'Energéticos': ['bolt', '#6E8F1E'],
  'Gás': ['flame', '#8A5A44'], 'Conveniência': ['box', '#1F8F9C'], 'Acessórios': ['tool', '#5B6B7A'], Outros: ['box', '#7A6A5B'],
};
export function Tile({ categoria, size = 52, gift }: { categoria: string; size?: number; gift?: boolean }) {
  const [g, h] = CAT[categoria] ?? CAT.Outros;
  return (
    <View style={{ width: size, height: size, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: h + '26' }}>
      <Icon name={gift ? 'gift' : g} size={size / 2} color={h} />
    </View>
  );
}

export function TierPill({ nivel }: { nivel: string }) {
  const c = useColors();
  const t = nivel === 'Ouro' ? c.gold : nivel === 'Prata' ? c.silver : c.bronze;
  return (
    <View style={[styles.pill, { backgroundColor: c.surface, gap: 6 }]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t }} />
      <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: t }}>{nivel}</Text>
    </View>
  );
}

export function statusColors(c: Colors, s: string): [string, string] {
  if (s === 'novo' || s === 'aguardando_pagamento') return [c.accentSoft, c.accent];
  if (s === 'separando' || s === 'implantacao') return [c.warnSoft, c.warn];
  if (s === 'em_rota') return [c.infoSoft, c.primary];
  if (s === 'entregue' || s === 'ativa') return [c.okSoft, c.ok];
  return [c.badSoft, c.bad];
}

export function Pill({ text, tone, onPress }: { text: string; tone: string; onPress?: () => void }) {
  const c = useColors();
  const [bg, fg] = statusColors(c, tone);
  const body = (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 11.5, color: fg }}>{text}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button">{body}</Pressable> : body;
}

export function StatusPill({ status }: { status: string }) {
  return <Pill text={STATUS[status] ?? status} tone={status} />;
}

export function Tag({ text, tone }: { text: string; tone?: 'rs' | 'bl' }) {
  const c = useColors();
  const fg = tone === 'rs' ? c.accent : tone === 'bl' ? c.primary : c.muted;
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: tone ? fg + '66' : c.line, backgroundColor: c.surface2, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: F.bodySemi, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: fg }}>{text}</Text>
    </View>
  );
}

export function Track({ status, retirada }: { status: string; retirada?: boolean }) {
  const c = useColors();
  const flow = retirada ? ['novo', 'separando', 'entregue'] : ['novo', 'separando', 'em_rota', 'entregue'];
  const i = flow.indexOf(status);
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {flow.map((s, k) => (
        <View key={s} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 4, borderRadius: 99, backgroundColor: k <= i ? c.ok : c.line }} />
          <Text style={{ fontFamily: F.body, fontSize: 10.5, color: k <= i ? c.ink : c.muted }}>{s === 'entregue' && retirada ? 'Retirado' : STATUS[s]}</Text>
        </View>
      ))}
    </View>
  );
}

export function Logo({ nome, cor, size = 48 }: { nome: string; cor: string; size?: number }) {
  const ini = nome.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: cor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: F.disp, fontSize: size * 0.4, letterSpacing: 0.4 }}>{ini}</Text>
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      {typeof children === 'string' ? <Text style={{ fontFamily: F.body, color: c.muted, textAlign: 'center', fontSize: 13.5 }}>{children}</Text> : children}
    </View>
  );
}

/* ---------- Caixas de aviso ---------- */
export function Box({ tone, children, style }: { tone: 'note' | 'alert' | 'err' | 'gain' | 'closed' | 'info'; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const m = {
    note: [c.surface2, c.muted], alert: [c.warnSoft, c.warn], err: [c.badSoft, c.bad], closed: [c.badSoft, c.bad], gain: [c.okSoft, c.ok], info: [c.infoSoft, c.primary],
  }[tone];
  return (
    <View style={[{ backgroundColor: m[0], borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }, style]}>
      {typeof children === 'string' || Array.isArray(children) ? <Text style={{ fontFamily: F.body, fontSize: 13, color: m[1] }}>{children}</Text> : children}
    </View>
  );
}
/** Texto dentro de uma Box, na cor dela. */
export function BoxText({ tone, children, bold }: { tone: 'note' | 'alert' | 'err' | 'gain' | 'closed' | 'info'; children: ReactNode; bold?: boolean }) {
  const c = useColors();
  const color = { note: c.muted, alert: c.warn, err: c.bad, closed: c.bad, gain: c.ok, info: c.primary }[tone];
  return <Text style={{ fontFamily: bold ? F.bodySemi : F.body, fontSize: 13, color }}>{children}</Text>;
}

/* ---------- Botões ---------- */
type BtnKind = 'primary' | 'acc' | 'ghost' | 'danger';
export function Btn({ title, onPress, kind = 'primary', disabled, small, style, children }: {
  title?: string; onPress?: () => void; kind?: BtnKind; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode;
}) {
  const c = useColors();
  const bg = kind === 'primary' ? c.primary : kind === 'acc' ? c.accent : 'transparent';
  const fg = kind === 'primary' ? c.primaryInk : kind === 'acc' ? '#fff' : kind === 'danger' ? c.bad : c.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          backgroundColor: bg, borderRadius: small ? 9 : 12, paddingVertical: small ? 7 : 12, paddingHorizontal: small ? 11 : 14,
          alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          borderWidth: kind === 'ghost' || kind === 'danger' ? 1 : 0, borderColor: c.line,
        },
        style,
      ]}
    >
      {children ?? <Text style={{ color: fg, fontFamily: F.bodySemi, fontSize: small ? 13 : 14.5, textAlign: 'center' }}>{title}</Text>}
    </Pressable>
  );
}

export function LinkText({ children, onPress, color }: { children: ReactNode; onPress: () => void; color?: string }) {
  const c = useColors();
  return (
    <Text onPress={onPress} accessibilityRole="link" style={{ fontFamily: F.body, fontSize: 13, color: color ?? c.muted, textDecorationLine: 'underline', textAlign: 'center' }}>
      {children}
    </Text>
  );
}

/* ---------- Formulários ---------- */
export function Input({ label, big, style, ...p }: TextInputProps & { label?: string; big?: boolean }) {
  const c = useColors();
  const inp = (
    <TextInput
      placeholderTextColor={c.muted}
      {...p}
      style={[
        {
          borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, color: c.ink, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: big ? 12 : 10, fontFamily: big ? F.mono : F.body, fontSize: big ? 18 : 14.5,
        },
        p.multiline ? { minHeight: 110, textAlignVertical: 'top' } : null,
        style,
      ]}
    />
  );
  if (!label) return inp;
  return (
    <View style={{ gap: 5, flexGrow: 1 }}>
      <Text style={{ fontFamily: F.bodyMed, fontSize: 12.5, color: c.muted }}>{label}</Text>
      {inp}
    </View>
  );
}

/** Lista de opções em janela (substitui o <select> do site). */
export function Select<T extends string | number>({ label, value, options, onChange, placeholder, compact }: {
  label?: string; value: T | '' | null; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string; compact?: boolean;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  const box = (
    <Pressable
      onPress={() => setOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={label ?? placeholder}
      style={{ borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: compact ? 7 : 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: compact ? 13 : 14.5, color: cur ? c.ink : c.muted }} numberOfLines={1}>{cur?.label ?? placeholder ?? 'Selecione'}</Text>
      <Text style={{ color: c.muted }}>▾</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 5, flexGrow: 1 }}>
      {label && <Text style={{ fontFamily: F.bodyMed, fontSize: 12.5, color: c.muted }}>{label}</Text>}
      {box}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBg} onPress={() => setOpen(false)}>
          <Pressable style={[styles.selBox, { backgroundColor: c.surface }]} onPress={() => {}}>
            {label && <Txt k="h2" style={{ marginBottom: 8 }}>{label}</Txt>}
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: item.value === value ? c.infoSoft : pressed ? c.surface2 : 'transparent' })}
                >
                  <Text style={{ fontFamily: item.value === value ? F.bodySemi : F.body, fontSize: 14.5, color: item.value === value ? c.primary : c.ink }}>{item.label}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Txt k="sub">Nenhuma opção.</Txt>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Switch({ on, onPress, labelOn = 'Sim', labelOff = 'Não' }: { on: boolean; onPress: () => void; labelOn?: string; labelOff?: string }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: on ? c.ok : c.line, justifyContent: 'center' }}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: on ? 16 : 2 }} />
      </View>
      <Text style={{ fontFamily: on ? F.bodySemi : F.body, fontSize: 12.5, color: on ? c.ok : c.muted }}>{on ? labelOn : labelOff}</Text>
    </Pressable>
  );
}

export function Check({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: on ? c.primary : c.muted, backgroundColor: on ? c.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {on && <Text style={{ color: c.primaryInk, fontSize: 13, lineHeight: 15 }}>✓</Text>}
      </View>
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: c.ink }}>{children}</Text>
    </Pressable>
  );
}

export function Chips({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <Pressable key={it} onPress={() => onChange(it)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: on ? c.primary : c.line, backgroundColor: on ? c.infoSoft : c.surface }}>
            <Text style={{ fontFamily: on ? F.bodySemi : F.body, fontSize: 12.5, color: on ? c.primary : c.muted }}>{it}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Blocos ---------- */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors();
  const s = [{ backgroundColor: c.surface, borderRadius: 14, padding: 14, gap: 8 }, style];
  if (onPress) return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s, { opacity: pressed ? 0.85 : 1 }]}>{children}</Pressable>;
  return <View style={s}>{children}</View>;
}

export function Line({ left, right, total, rightColor }: { left: ReactNode; right: ReactNode; total?: boolean; rightColor?: string }) {
  const c = useColors();
  const st: TextStyle = total ? { fontFamily: F.bodySemi, fontSize: 16, color: c.ink } : { fontFamily: F.body, fontSize: 13.5, color: c.ink };
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, total ? { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8, marginTop: 2 } : null]}>
      <Text style={[st, { flexShrink: 1 }]}>{left}</Text>
      <Text style={[st, rightColor ? { color: rightColor, fontFamily: F.bodySemi } : null]}>{right}</Text>
    </View>
  );
}

/** Pergunta de confirmação em linha (cancelar pedido, excluir conta). */
export function Confirm({ text, yes, no, onYes, onNo }: { text: string; yes: string; no: string; onYes: () => void; onNo: () => void }) {
  const c = useColors();
  return (
    <Box tone="err" style={{ gap: 8 }}>
      <BoxText tone="err">{text}</BoxText>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Btn small kind="ghost" title={no} onPress={onNo} style={{ flex: 1, backgroundColor: c.surface }} />
        <Btn small onPress={onYes} style={{ flex: 1, backgroundColor: c.bad }}>
          <Text style={{ color: '#fff', fontFamily: F.bodySemi, fontSize: 13 }}>{yes}</Text>
        </Btn>
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 84, alignItems: 'center', paddingHorizontal: 16 },
  toast: { backgroundColor: '#15202B', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, maxWidth: 480 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  sheetBg: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  selBox: { width: '100%', maxWidth: 440, maxHeight: '75%', borderRadius: 16, padding: 16 },
});
