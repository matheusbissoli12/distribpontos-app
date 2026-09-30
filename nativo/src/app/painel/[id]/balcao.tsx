import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { usePanel, useWide } from '@/components/panel';
import { Box, BoxText, Btn, Card, Input, Txt, useToast } from '@/components/ui';
import { api, sb } from '@/lib/supabase';
import { brl, cpfValid, errMsg, hora, maskCel, maskCpf, num, onlyDigits, parseMoney } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Order } from '@/lib/types';

type Pend = { codeId: string; pts: number; nome: string | null; registrado: boolean; celular: string; devCode?: string; cpf: string; valor: number };

export default function Balcao() {
  const c = useColors();
  const wide = useWide();
  const { d } = usePanel();
  const toast = useToast();
  const [cpf, setCpf] = useState('');
  const [valor, setValor] = useState('');
  const [cupom, setCupom] = useState('');
  const [cel, setCel] = useState('');
  const [pend, setPend] = useState<Pend | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hist, setHist] = useState<Order[]>([]);

  const loadHist = useCallback(async () => {
    const { data } = await sb().from('orders').select('*').eq('distributor_id', d.id).eq('canal', 'balcao').order('created_at', { ascending: false }).limit(30);
    setHist((data as Order[]) ?? []);
  }, [d.id]);
  useEffect(() => { loadHist(); }, [loadHist]);

  const v = parseMoney(valor);
  const previa = cpfValid(cpf) && v > 0 ? Math.floor(v * Number(d.pts_por_real)) : null;

  async function enviar() {
    setErr('');
    if (!cpfValid(cpf)) return setErr('CPF inválido. Confira com o cliente.');
    if (!(v > 0)) return setErr('Informe o valor da compra.');
    setBusy(true);
    const r = await api<Omit<Pend, 'cpf' | 'valor'>>('/api/balcao', { body: { distId: d.id, cpf: onlyDigits(cpf), valor: v, cupom, celular: onlyDigits(cel) } });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error ?? 'Não foi possível enviar o código.');
    setPend({ ...r.data, cpf: onlyDigits(cpf), valor: v });
    setCode('');
  }
  async function confirmar() {
    if (!pend) return;
    setBusy(true);
    const { data, error } = await sb().rpc('counter_confirm', { p_code_id: pend.codeId, p_code: code.trim() });
    setBusy(false);
    if (error) return toast(errMsg(error));
    if (data === -1) return toast('Código não confere. Peça ao cliente para conferir a mensagem.');
    toast(`+${num(data as number)} pts lançados${pend.registrado ? ` para ${pend.nome}` : '. Ficam guardados até o cliente se cadastrar.'}`);
    setPend(null); setCpf(''); setValor(''); setCupom(''); setCel('');
    loadHist();
  }

  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, alignItems: 'flex-start' }}>
      <Card style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: 12 }}>
        {pend ? (
          <>
            <Txt k="h2">Confirmação do cliente</Txt>
            <Txt k="sub">Enviamos um código para {pend.celular}{pend.registrado ? ' (SMS e app)' : ' (SMS)'}. Peça ao cliente para dizer o código.</Txt>
            <Box tone="info">
              <BoxText tone="info"><Text style={{ fontFamily: F.bodySemi }}>{pend.registrado ? pend.nome : 'Cliente sem cadastro no app'}</Text> · {maskCpf(pend.cpf)}</BoxText>
              <BoxText tone="info">Compra de <Text style={{ fontFamily: F.bodySemi }}>{brl(pend.valor)}</Text> → <Text style={{ fontFamily: F.bodySemi }}>+{num(pend.pts)} pts</Text></BoxText>
            </Box>
            <Input label="Código de 4 dígitos" big keyboardType="number-pad" maxLength={4} placeholder="0000" value={code} onChangeText={(t) => setCode(onlyDigits(t))} onSubmitEditing={confirmar} autoFocus />
            {pend.devCode && <Box tone="alert"><BoxText tone="alert">Modo de teste (SMS desligado): o código é <Text style={{ fontFamily: F.mono }}>{pend.devCode}</Text></BoxText></Box>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn kind="ghost" title="Cancelar" onPress={() => setPend(null)} style={{ flex: 1 }} />
              <Btn kind="acc" disabled={busy || code.length !== 4} title="Confirmar e lançar" onPress={confirmar} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <>
            <Txt k="h2">Lançar compra da loja física</Txt>
            <Input label="CPF do cliente" keyboardType="number-pad" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChangeText={(t) => setCpf(maskCpf(t))} />
            <Input label="Valor da compra (R$)" keyboardType="decimal-pad" placeholder="0,00" value={valor} onChangeText={setValor} />
            <Input label="Nº do cupom fiscal (opcional)" autoComplete="off" value={cupom} onChangeText={setCupom} />
            <Input label="Celular do cliente (se ele ainda não tem o app)" keyboardType="phone-pad" placeholder="(27) 99999-9999" value={cel} onChangeText={(t) => setCel(maskCel(t))} />
            {previa !== null && <Box tone="gain"><BoxText tone="gain">Cliente ganha cerca de <Text style={{ fontFamily: F.bodySemi }}>+{num(previa)} pts</Text> (mais bônus do nível dele).</BoxText></Box>}
            {!!err && <Box tone="err">{err}</Box>}
            <Btn kind="acc" disabled={busy} title={busy ? 'Enviando…' : 'Enviar código de confirmação'} onPress={enviar} />
          </>
        )}
      </Card>
      <Card style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%' }}>
        <Txt k="h2">Últimos lançamentos</Txt>
        {hist.length === 0 && <Txt k="sub">Nenhum lançamento ainda.</Txt>}
        {hist.map((o) => (
          <View key={o.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 5, borderTopWidth: 1, borderTopColor: c.line }}>
            <View style={{ flex: 1 }}>
              <Txt k="b" style={{ fontSize: 13 }}>{o.cliente_nome || 'Cliente sem cadastro'}</Txt>
              <Txt k="sub">{hora(o.created_at)} · {brl(o.total)}{o.cupom ? ` · cupom ${o.cupom}` : ''}</Txt>
            </View>
            <Text style={{ fontFamily: F.bodySemi, color: c.ok }}>+{num(o.pontos)}</Text>
          </View>
        ))}
        <Box tone="note">Cada lançamento só vale depois que o cliente confirma o código recebido no celular. Isso impede que alguém lance pontos no próprio CPF.</Box>
      </Card>
    </View>
  );
}
