import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Cell, Frm, Row, usePanel, useWide } from '@/components/panel';
import { Box, Btn, Card, Input, LinkText, Select, Switch, Txt, useToast } from '@/components/ui';
import { api, sb } from '@/lib/supabase';
import { errMsg, parseMoney } from '@/lib/format';
import { useColors } from '@/lib/theme';
import type { Area, Bairro } from '@/lib/types';

const CORES = ['#1D4F7A', '#2A7DB5', '#1F8F9C', '#2A7A4B', '#6E8F1E', '#C4870F', '#D9621F', '#C23B2E', '#8E2F5C', '#5B3E8C', '#8A5A44', '#15202B'];
const maskHora = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d; };
const horaOk = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

function TaxaCell({ a, onSave }: { a: Area; onSave: (v: number) => void }) {
  const [v, setV] = useState(Number(a.taxa).toFixed(2).replace('.', ','));
  const save = () => { const n = parseMoney(v); if (n >= 0 && n !== Number(a.taxa)) onSave(n); };
  return <Input value={v} onChangeText={setV} onBlur={save} onSubmitEditing={save} keyboardType="decimal-pad" style={{ width: 90, textAlign: 'right', paddingVertical: 6 }} />;
}

export default function Config() {
  const c = useColors();
  const wide = useWide();
  const { d, members, userId, reload } = usePanel();
  const toast = useToast();
  const [f, setF] = useState({
    horario_abre: d.horario_abre.slice(0, 5), horario_fecha: d.horario_fecha.slice(0, 5), pedido_minimo: String(d.pedido_minimo).replace('.', ','),
    frete_gratis_acima: String(d.frete_gratis_acima).replace('.', ','), prazo_texto: d.prazo_texto, segmento: d.segmento, cor: d.cor,
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [nb, setNb] = useState<{ bairro: number | ''; taxa: string }>({ bairro: '', taxa: '' });
  const [conv, setConv] = useState({ nome: '', email: '', role: 'caixa' });
  const [mp, setMp] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAreas = useCallback(async () => {
    const [a, b] = await Promise.all([sb().from('delivery_areas').select('*').eq('distributor_id', d.id), sb().from('bairros').select('*').order('cidade').order('nome')]);
    setAreas((a.data as Area[]) ?? []);
    setBairros((b.data as Bairro[]) ?? []);
  }, [d.id]);
  useEffect(() => { loadAreas(); }, [loadAreas]);

  async function salvar() {
    if (!horaOk(f.horario_abre) || !horaOk(f.horario_fecha)) return toast('Use horários no formato 08:00.');
    if (!/^#[0-9a-fA-F]{6}$/.test(f.cor)) return toast('Cor inválida. Use o formato #1D4F7A.');
    const patch = {
      horario_abre: f.horario_abre, horario_fecha: f.horario_fecha, prazo_texto: f.prazo_texto.trim() || '40–60 min', segmento: f.segmento.trim() || 'Distribuidora', cor: f.cor,
      pedido_minimo: parseMoney(f.pedido_minimo) || 0, frete_gratis_acima: parseMoney(f.frete_gratis_acima) || 0,
    };
    if (patch.horario_fecha <= patch.horario_abre) return toast('O horário de fechamento precisa ser depois da abertura.');
    const { error } = await sb().from('distributors').update(patch).eq('id', d.id);
    if (error) return toast(errMsg(error));
    toast('Configurações salvas');
    reload();
  }
  async function pausar() {
    const { error } = await sb().from('distributors').update({ pausada: !d.pausada }).eq('id', d.id);
    if (error) return toast(errMsg(error));
    toast(d.pausada ? 'Loja recebendo pedidos de novo' : 'Pedidos pausados: a loja aparece fechada no app');
    reload();
  }
  async function addArea() {
    if (!nb.bairro) return toast('Escolha o bairro.');
    const { error } = await sb().from('delivery_areas').insert({ distributor_id: d.id, bairro_id: Number(nb.bairro), taxa: parseMoney(nb.taxa) || 0 });
    if (error) return toast(errMsg(error));
    setNb({ bairro: '', taxa: '' });
    loadAreas();
  }
  async function updArea(a: Area, taxa: number) {
    const { error } = await sb().from('delivery_areas').update({ taxa }).eq('distributor_id', d.id).eq('bairro_id', a.bairro_id);
    if (error) toast(errMsg(error)); else loadAreas();
  }
  async function rmArea(a: Area) {
    const { error } = await sb().from('delivery_areas').delete().eq('distributor_id', d.id).eq('bairro_id', a.bairro_id);
    if (error) toast(errMsg(error)); else loadAreas();
  }
  async function convidar() {
    if (!conv.email.includes('@')) return toast('Informe o e-mail.');
    setBusy(true);
    const r = await api<{ convidado?: boolean }>('/api/equipe', { body: { distId: d.id, ...conv } });
    setBusy(false);
    if (!r.ok) return toast(r.data.error ?? 'Não foi possível convidar.');
    toast(r.data.convidado ? 'Convite enviado por e-mail' : 'Pessoa adicionada à equipe');
    setConv({ nome: '', email: '', role: 'caixa' });
    reload();
  }
  async function remover(uid: string) {
    const { error } = await sb().from('members').delete().eq('distributor_id', d.id).eq('user_id', uid);
    if (error) return toast(errMsg(error));
    reload();
  }
  async function conectarMp(desligar = false) {
    setBusy(true);
    const r = await api<{ conta?: string }>('/api/mercadopago', { method: desligar ? 'DELETE' : 'POST', body: { distId: d.id, token: mp.trim() } });
    setBusy(false);
    if (!r.ok) return toast(r.data.error ?? 'Não foi possível conectar.');
    toast(desligar ? 'Pix desligado' : `Mercado Pago conectado${r.data.conta ? ` (${r.data.conta})` : ''}`);
    setMp('');
    reload();
  }

  const livres = bairros.filter((b) => !areas.some((a) => a.bairro_id === b.id));
  const nomeB = (id: number) => { const b = bairros.find((x) => x.id === id); return b ? `${b.nome} · ${b.cidade}` : `#${id}`; };

  return (
    <>
      <Txt k="sec">Funcionamento</Txt>
      <Frm>
        <Cell><View style={{ gap: 8 }}><Txt k="sub">Recebendo pedidos</Txt><Switch on={!d.pausada} onPress={pausar} labelOff="Pausado" /></View></Cell>
        <Cell min={110}><Input label="Abre às" placeholder="08:00" keyboardType="number-pad" value={f.horario_abre} onChangeText={(t) => setF({ ...f, horario_abre: maskHora(t) })} /></Cell>
        <Cell min={110}><Input label="Fecha às" placeholder="22:00" keyboardType="number-pad" value={f.horario_fecha} onChangeText={(t) => setF({ ...f, horario_fecha: maskHora(t) })} /></Cell>
        <Cell><Input label="Pedido mínimo (R$)" keyboardType="decimal-pad" value={f.pedido_minimo} onChangeText={(t) => setF({ ...f, pedido_minimo: t })} /></Cell>
        <Cell min={190}><Input label="Frete grátis acima de (R$, 0 = não)" keyboardType="decimal-pad" value={f.frete_gratis_acima} onChangeText={(t) => setF({ ...f, frete_gratis_acima: t })} /></Cell>
        <Cell><Input label="Prazo de entrega" value={f.prazo_texto} onChangeText={(t) => setF({ ...f, prazo_texto: t })} /></Cell>
        <Cell><Input label="Segmento" value={f.segmento} onChangeText={(t) => setF({ ...f, segmento: t })} /></Cell>
      </Frm>
      <View style={{ gap: 6 }}>
        <Txt k="sub">Cor da marca</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {CORES.map((cor) => (
            <Pressable key={cor} onPress={() => setF({ ...f, cor })} accessibilityRole="radio" accessibilityState={{ selected: f.cor.toLowerCase() === cor.toLowerCase() }} accessibilityLabel={cor}
              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: cor, borderWidth: f.cor.toLowerCase() === cor.toLowerCase() ? 3 : 0, borderColor: c.ink }} />
          ))}
          <Input value={f.cor} onChangeText={(t) => setF({ ...f, cor: t.startsWith('#') ? t.slice(0, 7) : '#' + t.slice(0, 6) })} autoCapitalize="none" style={{ width: 110, fontFamily: undefined, paddingVertical: 6 }} accessibilityLabel="Cor em hexadecimal" />
        </View>
      </View>
      <View style={{ alignItems: 'flex-start' }}><Btn title="Salvar funcionamento" onPress={salvar} /></View>

      <Txt k="sec">Área de entrega</Txt>
      {areas.length === 0 && <Txt k="sub">Nenhum bairro. Sem bairros, os clientes só conseguem retirar na loja.</Txt>}
      {areas.map((a) => (
        <Row key={a.bairro_id}>
          <Txt style={{ flex: wide ? 1 : undefined }}>{nomeB(a.bairro_id)}</Txt>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Txt k="mini">Taxa R$</Txt>
            <TaxaCell a={a} onSave={(v) => updArea(a, v)} />
            <LinkText color={c.bad} onPress={() => rmArea(a)}>Remover</LinkText>
          </View>
        </Row>
      ))}
      <Frm>
        <Cell grow={2} min={200}><Select label="Adicionar bairro" placeholder="Selecione" value={nb.bairro} onChange={(v) => setNb({ ...nb, bairro: v })} options={livres.map((b) => ({ value: b.id, label: `${b.nome} · ${b.cidade}` }))} /></Cell>
        <Cell min={100}><Input label="Taxa (R$)" keyboardType="decimal-pad" placeholder="0,00" value={nb.taxa} onChangeText={(t) => setNb({ ...nb, taxa: t })} /></Cell>
        <Btn kind="acc" title="Adicionar" onPress={addArea} />
      </Frm>
      <Txt k="mini">Falta algum bairro na lista? Peça ao administrador da plataforma para cadastrar.</Txt>

      <Txt k="sec">Equipe e permissões</Txt>
      {members.map((m) => (
        <Row key={m.user_id}>
          <View style={{ flex: wide ? 1.3 : undefined }}><Txt k="b">{m.nome || '—'}</Txt><Txt k="mini">{m.email}</Txt></View>
          <Txt style={{ minWidth: 90 }}>{m.role}</Txt>
          <Txt k="mini" style={{ flex: wide ? 1 : undefined }}>{m.role === 'dono' ? 'Tudo' : m.role === 'caixa' ? 'Pedidos, balcão e clientes' : 'Só as próprias entregas'}</Txt>
          {m.user_id !== userId && <LinkText color={c.bad} onPress={() => remover(m.user_id)}>Remover</LinkText>}
        </Row>
      ))}
      <Frm>
        <Cell><Input label="Nome" value={conv.nome} onChangeText={(t) => setConv({ ...conv, nome: t })} /></Cell>
        <Cell grow={1.6}><Input label="E-mail" keyboardType="email-address" autoCapitalize="none" value={conv.email} onChangeText={(t) => setConv({ ...conv, email: t })} /></Cell>
        <Cell><Select label="Função" value={conv.role} onChange={(v) => setConv({ ...conv, role: v })}
          options={[{ value: 'caixa', label: 'Caixa' }, { value: 'entregador', label: 'Entregador' }, { value: 'dono', label: 'Dono' }]} /></Cell>
        <Btn kind="acc" disabled={busy} title="Convidar" onPress={convidar} />
      </Frm>

      <Txt k="sec">Pix pelo app (Mercado Pago)</Txt>
      <Card>
        {d.pix_ativo ? (
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 10, alignItems: wide ? 'center' : 'stretch' }}>
            <Box tone="gain" style={{ flex: wide ? 1 : undefined }}>Pix conectado. O dinheiro dos pedidos cai direto na conta Mercado Pago da loja.</Box>
            <Btn kind="ghost" disabled={busy} title="Desligar Pix" onPress={() => conectarMp(true)} />
          </View>
        ) : (
          <>
            <Txt k="sub">No Mercado Pago da loja: Seu negócio › Configurações › Credenciais de produção › copie o Access Token e cole aqui. Ele fica guardado só no servidor.</Txt>
            <Frm>
              <Cell grow={3}><Input label="Access Token" secureTextEntry autoComplete="off" autoCapitalize="none" value={mp} onChangeText={setMp} placeholder="APP_USR-..." /></Cell>
              <Btn kind="acc" disabled={busy || mp.length < 20} title="Conectar" onPress={() => conectarMp()} />
            </Frm>
          </>
        )}
      </Card>
    </>
  );
}
