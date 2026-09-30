import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, usePathname, type Href } from 'expo-router';
import { sb } from '@/lib/supabase';
import { useEndereco } from '@/lib/cart';
import { num } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import { Icon } from './ui';
import { AddressSheet } from './AddressSheet';
import { useSession } from './session';

export type Head = { title: string; subtitle?: string; color?: string; back?: string; right?: ReactNode };

export function goBack(fallback: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as Href);
}

/** Pílula clara usada no topo (pontos, entrar, alterar). */
export function HeadPill({ children, onPress, label, ink = '#fff' }: { children: ReactNode; onPress: () => void; label?: string; ink?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ color: ink, fontFamily: F.bodySemi, fontSize: 13 }}>{children}</Text>
    </Pressable>
  );
}

/** Casca do app do cliente: topo, endereço e menu inferior. */
export function AppShell({ children, head, showAddress, requireLogin, footer, onRefresh, scroll = true }: {
  children: ReactNode; head?: Head; showAddress?: boolean; requireLogin?: boolean; footer?: ReactNode; onRefresh?: () => Promise<unknown>; scroll?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const { user, profile, loading } = useSession();
  const end = useEndereco();
  const [sheet, setSheet] = useState(false);
  const [pts, setPts] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (requireLogin && !user) router.replace({ pathname: '/entrar', params: { next: path } });
    else if (user && !profile?.cpf && path !== '/cadastro') router.replace({ pathname: '/cadastro', params: { next: path } });
  }, [loading, user, profile, requireLogin, path]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.cpf) return;
      sb().rpc('my_wallets').then(({ data }) => setPts(((data as { saldo: number }[]) ?? []).reduce((a, w) => a + w.saldo, 0)));
      sb().from('notifications').select('id', { count: 'exact', head: true }).eq('lida', false).then(({ count }) => setUnread(count ?? 0));
    }, [profile?.cpf]),
  );

  const bg = head?.color ?? c.primary;
  const ink = head?.color ? '#fff' : c.primaryInk;
  const nav: [string, string, string][] = [
    ['/', 'Início', 'home'],
    ['/pedidos', 'Pedidos', 'list'],
    ['/pontos', 'Pontos', 'coin'],
    ['/perfil', 'Perfil', 'user'],
  ];
  const navOn = path === '/' || path.startsWith('/d/') || path === '/carrinho' ? '/' : '/' + (path.split('/')[1] ?? '');

  async function refresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  const body = (
    <View style={{ padding: 14, gap: 12, paddingBottom: footer ? 90 : 24, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.surface2 }}>
      <StatusBar style={ink === '#fff' || ink === '#FFFFFF' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: bg }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              {head?.back && (
                <Pressable onPress={() => goBack(head.back!)} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={10} style={{ paddingRight: 4 }}>
                  <Icon name="back" color={ink} size={24} />
                </Pressable>
              )}
              <View style={{ flexShrink: 1 }}>
                <Text numberOfLines={1} style={{ color: ink, fontFamily: F.disp, fontSize: 21, textTransform: 'uppercase', letterSpacing: 0.4 }}>{head?.title ?? 'DistribPontos'}</Text>
                <Text numberOfLines={1} style={{ color: ink, opacity: 0.88, fontFamily: F.body, fontSize: 12 }}>
                  {head?.subtitle ?? (profile?.nome ? `Olá, ${profile.nome.split(' ')[0]}` : 'Peça e ganhe pontos')}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {head?.right}
              {!head?.right && user && profile?.cpf && (
                <>
                  <HeadPill ink={ink} onPress={() => router.navigate('/pontos')}>{pts === null ? '…' : num(pts)} pts</HeadPill>
                  <Pressable onPress={() => router.push('/avisos')} accessibilityRole="button" accessibilityLabel={`Avisos${unread ? `, ${unread} novos` : ''}`} hitSlop={8}>
                    <Icon name="bell" size={22} color={ink} />
                    {unread > 0 && (
                      <View style={{ position: 'absolute', top: -5, right: -7, backgroundColor: c.accent, borderRadius: 9, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 10.5, fontFamily: F.bodySemi }}>{unread}</Text>
                      </View>
                    )}
                  </Pressable>
                </>
              )}
              {!head?.right && !loading && !user && <HeadPill ink={ink} onPress={() => router.push({ pathname: '/entrar', params: { next: path } })}>Entrar</HeadPill>}
            </View>
          </View>
          {showAddress && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}>
              <Text style={{ flex: 1, color: ink, fontFamily: F.body, fontSize: 12.5 }} numberOfLines={2}>
                {!end ? 'Informe o endereço de entrega' : end.retirada ? 'Vou retirar na loja' : (
                  <>Entregar em <Text style={{ fontFamily: F.bodySemi }}>{end.rua}{end.comp ? `, ${end.comp}` : ''}, {end.bairro}</Text></>
                )}
              </Text>
              <HeadPill ink={ink} onPress={() => setSheet(true)}>{end ? 'Alterar' : 'Definir'}</HeadPill>
            </View>
          )}
        </View>
      </SafeAreaView>
      {scroll ? (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} /> : undefined}>
          {body}
        </ScrollView>
      ) : <View style={{ flex: 1 }}>{body}</View>}
      {footer && <View style={{ position: 'absolute', left: 12, right: 12, bottom: 74 + insets.bottom, alignItems: 'center' }} pointerEvents="box-none">{footer}</View>}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line }}>
        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 560, alignSelf: 'center' }} accessibilityRole="tablist">
          {nav.map(([href, label, icon]) => {
            const on = navOn === href;
            return (
              <Pressable key={href} onPress={() => router.navigate(href as Href)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8 }}>
                <Icon name={icon} color={on ? c.primary : c.muted} />
                <Text style={{ fontSize: 11, color: on ? c.primary : c.muted, fontFamily: on ? F.bodySemi : F.body }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
      <AddressSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

/** Barra de título simples (login, cadastro, termos). */
export function SimpleHead({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: c.primary }}>
      <StatusBar style={c.primaryInk === '#FFFFFF' ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {back && (
          <Pressable onPress={() => goBack(back)} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={10}>
            <Icon name="back" color={c.primaryInk} size={24} />
          </Pressable>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: c.primaryInk, fontFamily: F.disp, fontSize: 21, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</Text>
          {subtitle && <Text style={{ color: c.primaryInk, opacity: 0.88, fontFamily: F.body, fontSize: 12 }}>{subtitle}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}
