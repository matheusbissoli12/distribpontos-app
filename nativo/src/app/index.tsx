import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { DCard, PtsCol } from '@/components/DCard';
import { Empty, Icon, Input, Spinner, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { useEndereco } from '@/lib/cart';
import { brl, num } from '@/lib/format';
import { isDesktop } from '@/lib/platform';
import { isOpen, openText } from '@/lib/store';
import { F, useColors } from '@/lib/theme';
import type { Area, Distributor, Wallet } from '@/lib/types';

export default function Home() {
  if (isDesktop) return <Redirect href="/painel" />;
  return <Lojas />;
}

function Lojas() {
  const c = useColors();
  const end = useEndereco();
  const [dists, setDists] = useState<Distributor[] | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const [d, a, w] = await Promise.all([
      sb().from('distributors').select('*').eq('status', 'ativa').order('nome'),
      sb().from('delivery_areas').select('*'),
      sb().rpc('my_wallets'),
    ]);
    setDists((d.data as Distributor[]) ?? []);
    setAreas((a.data as Area[]) ?? []);
    setWallets((w.data as Wallet[]) ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const bairroId = end && !end.retirada ? end.bairro_id : null;
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (dists ?? []).filter((d) => !t || (d.nome + d.segmento + d.cidade).toLowerCase().includes(t));
  }, [dists, q]);
  const areaOf = (d: Distributor) => (bairroId ? areas.find((a) => a.distributor_id === d.id && a.bairro_id === bairroId) : undefined);
  const entregam = bairroId ? lista.filter((d) => areaOf(d)).sort((a, b) => Number(isOpen(b)) - Number(isOpen(a))) : [];
  const outras = bairroId ? lista.filter((d) => !areaOf(d)) : lista;

  const card = (d: Distributor, modo: 'entrega' | 'retirada' | 'neutro') => {
    const w = wallets.find((x) => x.distributor_id === d.id);
    const a = areaOf(d);
    const ab = isOpen(d);
    return (
      <DCard key={d.id} nome={d.nome} cor={d.cor} onPress={() => router.push(`/d/${d.id}`)}
        lines={[
          d.segmento,
          <Text key="st" style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}>
            <Text style={{ fontFamily: F.bodySemi, color: ab ? c.ok : c.bad }}>{openText(d)}</Text> ·{' '}
            {modo === 'neutro' ? `${d.bairro}, ${d.cidade}` : modo === 'retirada' ? 'só retirada' : a && Number(a.taxa) > 0 ? `entrega ${brl(a.taxa)}` : 'entrega grátis'}
          </Text>,
        ]}
        right={w ? <PtsCol value={num(w.saldo)} /> : <PtsCol empty={'Sem pontos\nainda'} />}
      />
    );
  };

  return (
    <AppShell showAddress onRefresh={load}>
      <View style={{ justifyContent: 'center' }}>
        <Input placeholder="Buscar distribuidora…" value={q} onChangeText={setQ} accessibilityLabel="Buscar distribuidora" style={{ paddingLeft: 38 }} returnKeyType="search" />
        <View style={{ position: 'absolute', left: 11 }} pointerEvents="none"><Icon name="search" size={18} color={c.muted} /></View>
      </View>
      {dists === null ? (
        <Spinner />
      ) : !bairroId ? (
        <>
          <Txt k="h2">Distribuidoras parceiras</Txt>
          <View style={{ gap: 8 }}>
            {outras.length ? outras.map((d) => card(d, end?.retirada ? 'retirada' : 'neutro')) : q.trim() ? <Empty>Nenhuma distribuidora encontrada.</Empty> : (
              <Empty>
                <Txt k="b" style={{ textAlign: 'center' }}>Em breve, as distribuidoras da sua região.</Txt>
                <Txt k="sub" style={{ textAlign: 'center', marginTop: 6 }}>Estamos fechando as primeiras parcerias. Crie sua conta agora: seu CPF já vira seu cartão fidelidade.</Txt>
              </Empty>
            )}
          </View>
        </>
      ) : (
        <>
          <Txt k="h2">Entregam em {end && !end.retirada ? end.bairro : ''}</Txt>
          <View style={{ gap: 8 }}>{entregam.length ? entregam.map((d) => card(d, 'entrega')) : <Empty>Nenhuma distribuidora parceira entrega neste bairro ainda.</Empty>}</View>
          {outras.length > 0 && (
            <>
              <Txt k="sec">Não entregam no seu bairro · retirada na loja</Txt>
              <View style={{ gap: 8 }}>{outras.map((d) => card(d, 'retirada'))}</View>
            </>
          )}
        </>
      )}
      <Txt k="sub" style={{ textAlign: 'center', marginTop: 10 }} onPress={() => router.push('/painel/login')}>
        É de uma distribuidora? <Text style={{ textDecorationLine: 'underline', color: c.primary }}>Acesse o painel</Text>
      </Txt>
    </AppShell>
  );
}
