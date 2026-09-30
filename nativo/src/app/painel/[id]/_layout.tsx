import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, Slot, useLocalSearchParams, usePathname, type Href } from 'expo-router';
import { PanelCtx, PWrap, useWide, type PanelState } from '@/components/panel';
import { Box, Btn, Logo, Pill, Spinner, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { isOpen, openText } from '@/lib/store';
import { F, useColors } from '@/lib/theme';
import type { Distributor, Member } from '@/lib/types';

const TABS: [string, string, string[]][] = [
  ['', 'Pedidos', ['dono', 'caixa', 'entregador']],
  ['/balcao', 'Balcão', ['dono', 'caixa']],
  ['/catalogo', 'Catálogo', ['dono']],
  ['/premios', 'Pontos e prêmios', ['dono']],
  ['/clientes', 'Clientes', ['dono', 'caixa']],
  ['/config', 'Configurações', ['dono']],
];

export default function PanelLayout() {
  const c = useColors();
  const wide = useWide();
  const { id } = useLocalSearchParams<{ id: string }>();
  const path = usePathname();
  const [st, setSt] = useState<Omit<PanelState, 'reload'> | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data: s } = await sb().auth.getSession();
    const u = s.session?.user;
    if (!u) { router.replace('/painel/login'); return; }
    const [{ data: d }, { data: ms }] = await Promise.all([
      sb().from('distributors').select('*').eq('id', id).maybeSingle(),
      sb().from('members').select('*').eq('distributor_id', id),
    ]);
    const me = ((ms as Member[]) ?? []).find((m) => m.user_id === u.id);
    if (!d || !me) { setErr('Você não tem acesso a esta distribuidora.'); return; }
    setSt({ d: d as Distributor, role: me.role, userId: u.id, members: (ms as Member[]) ?? [] });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function sair() {
    await sb().auth.signOut();
    router.replace('/painel/login');
  }

  if (err) return <PWrap max={560}><Box tone="err">{err}</Box><Btn kind="ghost" title="Voltar" onPress={() => router.replace('/painel')} /></PWrap>;
  if (!st) return <PWrap><Spinner /></PWrap>;
  const base = `/painel/${id}`;
  const tabs = TABS.filter((t) => t[2].includes(st.role));
  const me = st.members.find((m) => m.user_id === st.userId);

  return (
    <PanelCtx.Provider value={{ ...st, reload: load }}>
      <PWrap>
        <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
          <View style={{ padding: 16, gap: 12, flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'center' : 'stretch' }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexShrink: 1 }}>
              <Logo nome={st.d.nome} cor={st.d.cor} />
              <View style={{ flexShrink: 1 }}>
                <Txt k="h2" style={{ fontSize: 21 }}>{st.d.nome}</Txt>
                <Txt k="sub">{me?.nome || me?.email} · {st.role}</Txt>
              </View>
            </View>
            <View style={{ alignItems: wide ? 'flex-end' : 'flex-start', gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Pill tone={st.d.status} text={st.d.status === 'ativa' ? 'No ar' : st.d.status === 'implantacao' ? 'Em implantação' : 'Suspensa'} />
                <Text style={{ fontFamily: F.bodySemi, fontSize: 12.5, color: isOpen(st.d) ? c.ok : c.bad }}>{openText(st.d)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Btn small kind="ghost" title="Trocar loja" onPress={() => router.replace('/painel')} />
                <Btn small kind="ghost" title="Sair" onPress={sair} />
              </View>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {tabs.map(([href, label]) => {
              const on = path === base + href;
              return (
                <Pressable key={href} onPress={() => router.replace((base + href) as Href)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                  style={{ paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: on ? c.accent : 'transparent' }}>
                  <Text style={{ fontFamily: on ? F.bodySemi : F.bodyMed, fontSize: 13.5, color: on ? c.ink : c.muted }}>
                    {st.role === 'entregador' && href === '' ? 'Minhas entregas' : label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ padding: 16, gap: 12, backgroundColor: c.surface2 }}>
            <Slot />
          </View>
        </View>
      </PWrap>
    </PanelCtx.Provider>
  );
}
