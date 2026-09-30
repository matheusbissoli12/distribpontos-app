import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Brand, PWrap } from '@/components/panel';
import { Box, Btn, Card, Input, LinkText, Txt } from '@/components/ui';
import { apiUrl, sb } from '@/lib/supabase';
import { errMsg } from '@/lib/format';
import { isDesktop } from '@/lib/platform';

export default function PainelLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function entrar() {
    setErr(''); setBusy(true);
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: senha });
    setBusy(false);
    if (error) return setErr('E-mail ou senha incorretos.');
    router.replace('/painel');
  }
  async function esqueci() {
    setErr('');
    if (!email.includes('@')) return setErr('Digite seu e-mail acima.');
    // O link do e-mail abre a página de nova senha do site (backend).
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), apiUrl ? { redirectTo: `${apiUrl}/auth/callback?next=/painel/senha` } : undefined);
    if (error) return setErr(errMsg(error));
    setMsg('Enviamos um link para criar uma nova senha. Depois de criar, entre aqui com ela.');
  }

  return (
    <PWrap max={440}>
      <View style={{ height: 40 }} />
      <Card style={{ gap: 14, padding: 20 }}>
        <View style={{ gap: 2 }}>
          <Brand />
          <Txt k="sub">Painel da distribuidora</Txt>
        </View>
        <Input label="E-mail" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="username" value={email} onChangeText={setEmail} />
        <Input label="Senha" secureTextEntry autoComplete="current-password" textContentType="password" value={senha} onChangeText={setSenha} onSubmitEditing={entrar} returnKeyType="go" />
        {!!err && <Box tone="err">{err}</Box>}
        {!!msg && <Box tone="gain">{msg}</Box>}
        <Btn disabled={busy} onPress={entrar} title={busy ? 'Entrando…' : 'Entrar'} />
        <LinkText onPress={esqueci}>Esqueci minha senha</LinkText>
      </Card>
      {!isDesktop && <LinkText onPress={() => router.replace('/')}>Voltar para o app do cliente</LinkText>}
    </PWrap>
  );
}
