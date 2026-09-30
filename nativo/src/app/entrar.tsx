import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SimpleHead } from '@/components/AppShell';
import { Box, Btn, Input, LinkText, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { errMsg, maskCel, onlyDigits, toE164 } from '@/lib/format';
import { useColors } from '@/lib/theme';

export default function Entrar() {
  const c = useColors();
  const { next: nextParam } = useLocalSearchParams<{ next?: string }>();
  const next = nextParam || '/';
  const [cel, setCel] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'cel' | 'code'>('cel');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar() {
    setErr('');
    if (onlyDigits(cel).length < 10) return setErr('Informe o celular com DDD.');
    setBusy(true);
    const { error } = await sb().auth.signInWithOtp({ phone: toE164(cel) });
    setBusy(false);
    if (error) return setErr(errMsg(error));
    setStep('code');
  }
  async function verificar() {
    setErr('');
    setBusy(true);
    const { data, error } = await sb().auth.verifyOtp({ phone: toE164(cel), token: code.trim(), type: 'sms' });
    if (error || !data.user) {
      setBusy(false);
      return setErr('Código incorreto ou expirado.');
    }
    const { data: p } = await sb().from('profiles').select('cpf').eq('id', data.user.id).maybeSingle();
    setBusy(false);
    if (p?.cpf) router.replace(next as Href);
    else router.replace({ pathname: '/cadastro', params: { next } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.surface2 }}>
      <SimpleHead title="DistribPontos" subtitle="Peça e ganhe pontos nas distribuidoras da sua região" back="/" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, width: '100%', maxWidth: 480, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
          <Txt k="h1">{step === 'cel' ? 'Entre com seu celular' : 'Digite o código'}</Txt>
          {step === 'cel' ? (
            <>
              <Txt k="sub">Enviamos um código por SMS. Na primeira vez, você completa o cadastro com seu CPF, que vira seu cartão fidelidade.</Txt>
              <Input label="Celular com DDD" big keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="(27) 99999-9999"
                value={cel} onChangeText={(t) => setCel(maskCel(t))} onSubmitEditing={enviar} returnKeyType="send" />
              {!!err && <Box tone="err">{err}</Box>}
              <Btn disabled={busy} onPress={enviar} title={busy ? 'Enviando…' : 'Receber código por SMS'} />
            </>
          ) : (
            <>
              <Txt k="sub">Enviamos um SMS para {cel}.</Txt>
              <Input label="Código" big keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" maxLength={6} placeholder="000000"
                value={code} onChangeText={(t) => setCode(onlyDigits(t))} onSubmitEditing={verificar} autoFocus />
              {!!err && <Box tone="err">{err}</Box>}
              <Btn disabled={busy || code.length < 4} onPress={verificar} title={busy ? 'Entrando…' : 'Entrar'} />
              <Btn kind="ghost" onPress={() => { setStep('cel'); setCode(''); }} title="Trocar número" />
            </>
          )}
          <LinkText onPress={() => router.push('/termos')}>Termos de uso e política de privacidade</LinkText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
