import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sb } from '@/lib/supabase';
import { getEndereco, setEndereco } from '@/lib/cart';
import { useColors } from '@/lib/theme';
import type { Bairro } from '@/lib/types';
import { Box, Btn, Input, LinkText, Select, Txt } from './ui';

export function AddressSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useColors();
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroId, setBairroId] = useState<number | ''>('');
  const [rua, setRua] = useState('');
  const [comp, setComp] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!visible) return;
    const atual = getEndereco();
    const e = atual && !atual.retirada ? atual : null;
    setBairroId(e ? e.bairro_id : '');
    setRua(e?.rua ?? '');
    setComp(e?.comp ?? '');
    setErr('');
    sb().from('bairros').select('*').order('cidade').order('nome').then(({ data }) => setBairros((data as Bairro[]) ?? []));
  }, [visible]);

  function salvar() {
    const b = bairros.find((x) => x.id === bairroId);
    if (!b) return setErr('Selecione o bairro.');
    if (rua.trim().length < 4) return setErr('Informe rua e número.');
    setEndereco({ bairro_id: b.id, bairro: b.nome, cidade: b.cidade, rua: rua.trim(), comp: comp.trim() });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.bg} onPress={onClose} accessibilityLabel="Fechar" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.surface }]}>
          <ScrollView contentContainerStyle={{ gap: 12, padding: 18 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.grip, { backgroundColor: c.line }]} />
            <Txt k="h2">Onde vamos entregar?</Txt>
            <Txt k="sub">Informe o endereço deste pedido para ver as distribuidoras que atendem você.</Txt>
            {bairros.length === 0 && <Box tone="alert">Ainda não atendemos nenhum bairro. Enquanto isso, você pode retirar os pedidos na loja.</Box>}
            <Select label="Bairro" placeholder="Selecione o bairro" value={bairroId} onChange={setBairroId}
              options={bairros.map((b) => ({ value: b.id, label: `${b.nome} · ${b.cidade}` }))} />
            <Input label="Rua e número" autoComplete="street-address" placeholder="Ex.: Rua das Palmeiras, 45" value={rua} onChangeText={setRua} />
            <Input label="Complemento (opcional)" placeholder="Apto, bloco, referência" value={comp} onChangeText={setComp} />
            {!!err && <Box tone="err">{err}</Box>}
            <Btn title="Confirmar endereço" onPress={salvar} />
            <Btn kind="ghost" title="Prefiro retirar na loja" onPress={() => { setEndereco({ retirada: true }); onClose(); }} />
            <LinkText onPress={onClose}>Cancelar</LinkText>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.45)' },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  grip: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
});
