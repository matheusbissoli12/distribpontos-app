import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/components/session';
import { Btn, Card, Confirm, Spinner, Switch, Txt, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { clearCart, setEndereco } from '@/lib/cart';
import { errMsg, maskCel, maskCpf } from '@/lib/format';
import { F, useColors } from '@/lib/theme';

function KV({ k, children }: { k: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
      <Txt k="sub">{k}</Txt>
      {typeof children === 'string' ? <Txt k="b" style={{ flexShrink: 1, textAlign: 'right' }}>{children}</Txt> : children}
    </View>
  );
}

export default function Perfil() {
  const c = useColors();
  const toast = useToast();
  const { profile, refresh } = useSession();
  const [del, setDel] = useState(false);

  async function toggleMkt() {
    if (!profile) return;
    const { error } = await sb().from('profiles').update({ mkt_optin: !profile.mkt_optin }).eq('id', profile.id);
    if (error) toast(errMsg(error)); else refresh();
  }
  async function pedir(tipo: 'copia' | 'exclusao') {
    const { error } = await sb().rpc('request_lgpd', { p_tipo: tipo });
    if (error) return toast(errMsg(error));
    toast(tipo === 'copia' ? 'Pedido registrado. Você recebe a cópia em até 15 dias.' : 'Pedido de exclusão registrado. Concluímos em até 15 dias e avisamos você.');
    setDel(false);
  }
  async function sair() {
    await sb().auth.signOut();
    clearCart();
    setEndereco(null);
    router.replace('/');
  }

  return (
    <AppShell requireLogin>
      {!profile ? <Spinner /> : (
        <>
          <View style={{ backgroundColor: c.primary, borderRadius: 16, padding: 16, gap: 4, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, borderWidth: 18, borderColor: 'rgba(255,255,255,.1)' }} />
            <Text style={{ color: c.primaryInk, opacity: 0.85, fontFamily: F.body, fontSize: 12 }}>Cartão fidelidade · informe no caixa</Text>
            <Text style={{ color: c.primaryInk, fontFamily: F.mono, fontSize: 21, letterSpacing: 1.2 }}>{maskCpf(profile.cpf ?? '')}</Text>
            <Text style={{ color: c.primaryInk, opacity: 0.85, fontFamily: F.body, fontSize: 12 }}>{profile.nome}</Text>
          </View>
          <Card style={{ gap: 0 }}>
            <Txt k="h2" style={{ marginBottom: 6 }}>Meus dados</Txt>
            <KV k="Nome">{profile.nome ?? ''}</KV>
            <KV k="CPF"><Txt k="mono">{maskCpf(profile.cpf ?? '')}</Txt></KV>
            <KV k="Celular">{maskCel(profile.celular ?? '')}</KV>
            {profile.email ? <KV k="E-mail">{profile.email}</KV> : null}
            <KV k="Ofertas e avisos"><Switch on={profile.mkt_optin} onPress={toggleMkt} /></KV>
          </Card>
          <Card>
            <Txt k="h2">Privacidade (LGPD)</Txt>
            <Btn kind="ghost" title="Termos de uso e política de privacidade" onPress={() => router.push('/termos')} />
            <Btn kind="ghost" title="Pedir cópia dos meus dados" onPress={() => pedir('copia')} />
            {del
              ? <Confirm text="Excluir sua conta apaga seus dados e todos os seus pontos. Não dá para desfazer." no="Manter conta" yes="Pedir exclusão" onNo={() => setDel(false)} onYes={() => pedir('exclusao')} />
              : <Btn kind="danger" title="Excluir minha conta" onPress={() => setDel(true)} />}
          </Card>
          <Btn kind="ghost" title="Sair da conta" onPress={sair} />
        </>
      )}
    </AppShell>
  );
}
