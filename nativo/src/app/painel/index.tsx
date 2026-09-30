import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { DCard } from '@/components/DCard';
import { Brand, PWrap } from '@/components/panel';
import { Box, Btn, LinkText, Spinner, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { isDesktop } from '@/lib/platform';

type M = { role: string; distributors: { id: string; nome: string; cor: string; status: string } | null };

export default function PainelHome() {
  const [lista, setLista] = useState<M[] | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await sb().auth.getSession();
      const u = s.session?.user;
      if (!u) return router.replace('/painel/login');
      const [{ data }, { data: p }] = await Promise.all([
        sb().from('members').select('role, distributors(id, nome, cor, status)').eq('user_id', u.id),
        sb().from('profiles').select('is_admin').eq('id', u.id).maybeSingle(),
      ]);
      const l = ((data as unknown as M[]) ?? []).filter((m) => m.distributors);
      setAdmin(!!p?.is_admin);
      if (l.length === 1 && !p?.is_admin) return router.replace(`/painel/${l[0].distributors!.id}`);
      setLista(l);
    })();
  }, []);

  async function sair() {
    await sb().auth.signOut();
    router.replace('/painel/login');
  }

  if (!lista) return <PWrap><Spinner /></PWrap>;
  return (
    <PWrap max={560}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brand />
        <Btn small kind="ghost" title="Sair" onPress={sair} />
      </View>
      {admin && <Btn title="Admin da plataforma" onPress={() => router.push('/admin')} />}
      {lista.length === 0 && <Box tone="note">Seu usuário ainda não está ligado a nenhuma distribuidora. Peça ao dono da loja para convidar você.</Box>}
      {lista.map((m) => (
        <DCard key={m.distributors!.id} nome={m.distributors!.nome} cor={m.distributors!.cor} onPress={() => router.push(`/painel/${m.distributors!.id}`)}
          lines={[`Você é ${m.role} · ${m.distributors!.status === 'ativa' ? 'no ar' : m.distributors!.status === 'implantacao' ? 'em implantação' : 'suspensa'}`]}
          right={<Txt k="sub">Abrir ›</Txt>} />
      ))}
      {!isDesktop && <LinkText onPress={() => router.replace('/')}>Voltar para o app do cliente</LinkText>}
    </PWrap>
  );
}
