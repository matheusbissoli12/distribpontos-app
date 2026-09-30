import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SimpleHead } from '@/components/AppShell';
import { useSession } from '@/components/session';
import { Box, Btn, Check, Input, Spinner, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { cpfValid, errMsg, maskCpf, onlyDigits } from '@/lib/format';
import { useColors } from '@/lib/theme';

export default function Cadastro() {
  const c = useColors();
  const { next: nextParam } = useLocalSearchParams<{ next?: string }>();
  const next = nextParam || '/';
  const { user, profile, loading, refresh } = useSession();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [mkt, setMkt] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/entrar');
    else if (profile?.cpf) router.replace(next as Href);
  }, [loading, user, profile, next]);

  async function salvar() {
    setErr('');
    if (nome.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome.');
    if (!cpfValid(cpf)) return setErr('CPF inválido. Confira os 11 números.');
    if (!ok) return setErr('Para participar é preciso aceitar os termos e o uso dos dados.');
    setBusy(true);
    const { error } = await sb().rpc('complete_profile', { p_nome: nome, p_cpf: onlyDigits(cpf), p_email: email, p_mkt: mkt, p_consent: ok });
    if (error) { setBusy(false); return setErr(errMsg(error)); }
    await refresh();
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.surface2 }}>
      <SimpleHead title="DistribPontos" subtitle="Complete seu cadastro" />
      {loading || !user ? <Spinner /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, width: '100%', maxWidth: 480, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
            <Txt k="h1">Seu CPF é seu cartão fidelidade</Txt>
            <Txt k="sub">Peça pelo app ou informe o CPF no caixa das distribuidoras parceiras. Se você já ganhou pontos numa loja, eles aparecem aqui.</Txt>
            <Input label="Nome completo" autoComplete="name" textContentType="name" value={nome} onChangeText={setNome} />
            <Input label="CPF" big keyboardType="number-pad" placeholder="000.000.000-00" value={cpf} onChangeText={(t) => setCpf(maskCpf(t))} />
            <Input label="E-mail (opcional, para comprovantes)" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} />
            <Check on={ok} onPress={() => setOk(!ok)}>
              Li e aceito os <Text style={{ textDecorationLine: 'underline', color: c.primary }} onPress={() => router.push('/termos')}>termos de uso</Text> e autorizo o uso do meu CPF e do histórico de compras para o programa de pontos (LGPD).
            </Check>
            <Check on={mkt} onPress={() => setMkt(!mkt)}>Quero receber ofertas e avisos de pontos.</Check>
            {!!err && <Box tone="err">{err}</Box>}
            <Btn kind="acc" disabled={busy} onPress={salvar} title={busy ? 'Salvando…' : 'Concluir cadastro'} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
