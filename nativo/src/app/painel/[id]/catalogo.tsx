import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Cell, Frm, Row, usePanel, useWide } from '@/components/panel';
import { Box, BoxText, Btn, Card, Input, LinkText, Pill, Select, Spinner, Switch, Txt, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { CATEGORIAS, errMsg, parseMoney } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Product } from '@/lib/types';

const EXEMPLO = 'nome;categoria;unidade;preço;estoque\nCerveja Pilsen lata 350ml;Cervejas;lata;4,49;240\nÁgua mineral galão 20L;Águas;galão (troca);16,00;35';
const CATS = CATEGORIAS.map((x) => ({ value: x, label: x }));

/** Campo editado na linha: salva quando sai do campo. */
function EditCell({ value, onSave, width, numeric, warn }: { value: string; onSave: (v: string) => void; width?: number; numeric?: boolean; warn?: boolean }) {
  const c = useColors();
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <Input value={v} onChangeText={setV} onBlur={() => v !== value && onSave(v)} onSubmitEditing={() => v !== value && onSave(v)}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={[{ paddingVertical: 6, fontSize: 13.5 }, width ? { width, textAlign: 'right' } : null, warn ? { borderColor: c.warn, color: c.warn } : null]} />
  );
}

export default function Catalogo() {
  const c = useColors();
  const wide = useWide();
  const { d } = usePanel();
  const toast = useToast();
  const [l, setL] = useState<Product[] | null>(null);
  const [f, setF] = useState({ nome: '', categoria: 'Cervejas', unidade: '', preco: '', estoque: '' });
  const [showImp, setShowImp] = useState(false);
  const [imp, setImp] = useState(EXEMPLO);
  const [impMsg, setImpMsg] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data } = await sb().from('products').select('*').eq('distributor_id', d.id).order('categoria').order('nome');
    setL((data as Product[]) ?? []);
  }, [d.id]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    const preco = parseMoney(f.preco);
    if (!f.nome.trim()) return toast('Dê um nome ao produto.');
    if (!(preco > 0)) return toast('Informe o preço.');
    const { error } = await sb().from('products').insert({ distributor_id: d.id, nome: f.nome.trim(), categoria: f.categoria, unidade: f.unidade.trim() || 'unidade', preco, estoque: parseInt(f.estoque) || 0 });
    if (error) return toast(errMsg(error));
    setF({ ...f, nome: '', unidade: '', preco: '', estoque: '' });
    toast('Produto adicionado');
    load();
  }
  async function upd(p: Product, patch: Partial<Product>) {
    const { error } = await sb().from('products').update(patch).eq('id', p.id);
    if (error) toast(errMsg(error)); else load();
  }
  async function del(p: Product) {
    const { error } = await sb().from('products').delete().eq('id', p.id);
    if (error) return toast('Não dá para apagar um produto que já foi vendido. Oculte-o em vez disso.');
    load();
  }
  async function importar() {
    const rows: Omit<Product, 'id' | 'ativo' | 'pontos_dobro'>[] = [];
    const errs: string[] = [];
    imp.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).forEach((line, i) => {
      const cols = line.split(/[;\t]/).map((x) => x.trim());
      if (i === 0 && /^nome$/i.test(cols[0])) return;
      const [nome, cat, un, pr, est] = cols;
      const preco = parseMoney(pr ?? '');
      if (!nome) return errs.push(`linha ${i + 1}: sem nome`);
      if (!(preco > 0)) return errs.push(`linha ${i + 1} (${nome}): preço inválido`);
      rows.push({ distributor_id: d.id, nome, categoria: CATEGORIAS.includes(cat) ? cat : 'Outros', unidade: un || 'unidade', preco, estoque: parseInt(est) || 0 });
    });
    if (rows.length) {
      const { error } = await sb().from('products').insert(rows);
      if (error) return setImpMsg(errMsg(error));
    }
    setImpMsg(`${rows.length} produtos importados.${errs.length ? ` ${errs.length} com erro: ${errs.join('; ')}.` : ''}`);
    load();
  }
  async function arquivo() {
    const r = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    try {
      const txt = await (await fetch(r.assets[0].uri)).text();
      setImp(txt);
    } catch {
      toast('Não foi possível ler o arquivo.');
    }
  }

  if (!l) return <Spinner />;
  const baixo = l.filter((p) => p.ativo && p.estoque <= 5);
  const vis = l.filter((p) => !q.trim() || p.nome.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      {baixo.length > 0 && (
        <Box tone="alert"><BoxText tone="alert"><Text style={{ fontFamily: F.bodySemi }}>Estoque baixo:</Text> {baixo.map((p) => `${p.nome} (${p.estoque})`).join(', ')}. Com estoque 0 o produto aparece esgotado no app.</BoxText></Box>
      )}
      <Txt k="sec">Adicionar produto</Txt>
      <Frm>
        <Cell grow={2} min={200}><Input label="Nome" value={f.nome} onChangeText={(t) => setF({ ...f, nome: t })} placeholder="Ex.: Cerveja Pilsen 600ml" /></Cell>
        <Cell grow={1.2}><Select label="Categoria" value={f.categoria} options={CATS} onChange={(v) => setF({ ...f, categoria: v })} /></Cell>
        <Cell><Input label="Unidade" value={f.unidade} onChangeText={(t) => setF({ ...f, unidade: t })} placeholder="garrafa, fardo 12" /></Cell>
        <Cell min={100}><Input label="Preço (R$)" keyboardType="decimal-pad" value={f.preco} onChangeText={(t) => setF({ ...f, preco: t })} placeholder="0,00" /></Cell>
        <Cell min={90}><Input label="Estoque" keyboardType="number-pad" value={f.estoque} onChangeText={(t) => setF({ ...f, estoque: t })} placeholder="0" /></Cell>
        <Btn kind="acc" title="Adicionar" onPress={add} />
      </Frm>
      <LinkText color={c.primary} onPress={() => setShowImp(!showImp)}>{showImp ? 'Fechar importação' : 'Importar vários produtos de uma planilha'}</LinkText>
      {showImp && (
        <Card>
          <Txt k="sub">Cole as linhas (colunas: nome; categoria; unidade; preço; estoque) ou escolha um .csv exportado do Excel ou do seu sistema.</Txt>
          <Input multiline value={imp} onChangeText={setImp} style={{ fontFamily: F.mono, fontSize: 12, minHeight: 130 }} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Btn kind="ghost" title="Escolher arquivo .csv" onPress={arquivo} />
            <Btn kind="acc" title="Importar" onPress={importar} />
          </View>
          {!!impMsg && <Box tone="note">{impMsg}</Box>}
        </Card>
      )}
      <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', alignItems: wide ? 'center' : 'stretch', gap: 8 }}>
        <Txt k="sec">Catálogo ({l.length} produtos)</Txt>
        <View style={{ width: wide ? 260 : '100%' }}><Input placeholder="Filtrar…" value={q} onChangeText={setQ} /></View>
      </View>
      {vis.map((p) => (
        <Row key={p.id}>
          <View style={{ flex: wide ? 2 : undefined, minWidth: 180 }}><EditCell value={p.nome} onSave={(v) => v.trim() && upd(p, { nome: v.trim() })} /></View>
          <View style={{ flex: wide ? 1.2 : undefined, minWidth: 130 }}><Select compact value={p.categoria} options={CATS} onChange={(v) => upd(p, { categoria: v })} /></View>
          <View style={{ flex: wide ? 1 : undefined, minWidth: 110 }}><EditCell value={p.unidade} onSave={(v) => upd(p, { unidade: v || 'unidade' })} /></View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Txt k="mini">R$</Txt>
            <EditCell numeric width={90} value={Number(p.preco).toFixed(2).replace('.', ',')} onSave={(s) => { const v = parseMoney(s); if (v > 0 && v !== Number(p.preco)) upd(p, { preco: v }); }} />
            <Txt k="mini">Estoque</Txt>
            <EditCell numeric width={70} warn={p.estoque <= 5} value={String(p.estoque)} onSave={(s) => { const v = parseInt(s); if (v >= 0 && v !== p.estoque) upd(p, { estoque: v }); }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ gap: 2 }}><Txt k="mini">2× pontos</Txt><Switch on={p.pontos_dobro} onPress={() => upd(p, { pontos_dobro: !p.pontos_dobro })} /></View>
            <View style={{ gap: 2 }}><Txt k="mini">No app</Txt><Pill tone={p.ativo ? 'entregue' : 'cancelado'} text={p.ativo ? 'Visível' : 'Oculto'} onPress={() => upd(p, { ativo: !p.ativo })} /></View>
            <LinkText color={c.bad} onPress={() => del(p)}>Apagar</LinkText>
          </View>
        </Row>
      ))}
    </>
  );
}
