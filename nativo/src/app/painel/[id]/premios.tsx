import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Cell, Frm, Row, usePanel, useWide } from '@/components/panel';
import { Box, Btn, Input, Pill, Select, Spinner, Txt, useToast } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { brl, CATEGORIAS, errMsg } from '@/lib/format';
import type { Reward } from '@/lib/types';

const CATS = CATEGORIAS.map((x) => ({ value: x, label: x }));

function CustoCell({ r, onSave }: { r: Reward; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(r.custo));
  useEffect(() => setV(String(r.custo)), [r.custo]);
  const save = () => { const n = parseInt(v); if (n > 0 && n !== r.custo) onSave(n); };
  return <Input value={v} onChangeText={setV} onBlur={save} onSubmitEditing={save} keyboardType="number-pad" style={{ width: 90, textAlign: 'right', paddingVertical: 6 }} />;
}

export default function Premios() {
  const wide = useWide();
  const { d, reload } = usePanel();
  const toast = useToast();
  const [l, setL] = useState<Reward[] | null>(null);
  const [cfg, setCfg] = useState({ pts_por_real: String(d.pts_por_real), nivel_prata: String(d.nivel_prata), nivel_ouro: String(d.nivel_ouro), validade_meses: String(d.validade_meses) });
  const [f, setF] = useState({ nome: '', categoria: 'Cervejas', custo: '' });

  const load = useCallback(async () => {
    const { data } = await sb().from('rewards').select('*').eq('distributor_id', d.id).order('custo');
    setL((data as Reward[]) ?? []);
  }, [d.id]);
  useEffect(() => { load(); }, [load]);

  async function salvarRegra() {
    const v = { pts_por_real: Number(cfg.pts_por_real.replace(',', '.')), nivel_prata: parseInt(cfg.nivel_prata), nivel_ouro: parseInt(cfg.nivel_ouro), validade_meses: parseInt(cfg.validade_meses) };
    if (!(v.pts_por_real > 0) || !(v.nivel_prata > 0) || !(v.nivel_ouro > v.nivel_prata) || !(v.validade_meses >= 1)) return toast('Confira os valores: o nível Ouro precisa ser maior que o Prata.');
    const { error } = await sb().from('distributors').update(v).eq('id', d.id);
    if (error) return toast(errMsg(error));
    toast('Regra de pontos salva');
    reload();
  }
  async function add() {
    const custo = parseInt(f.custo);
    if (!f.nome.trim()) return toast('Dê um nome ao prêmio.');
    if (!(custo > 0)) return toast('Informe o custo em pontos.');
    const { error } = await sb().from('rewards').insert({ distributor_id: d.id, nome: f.nome.trim(), categoria: f.categoria, custo });
    if (error) return toast(errMsg(error));
    setF({ ...f, nome: '', custo: '' });
    load();
  }
  async function upd(r: Reward, patch: Partial<Reward>) {
    const { error } = await sb().from('rewards').update(patch).eq('id', r.id);
    if (error) toast(errMsg(error)); else load();
  }

  if (!l) return <Spinner />;
  const ppr = Number(d.pts_por_real);
  return (
    <>
      <Txt k="sec">Regra de pontuação</Txt>
      <Frm>
        <Cell><Input label="Pontos por R$ 1,00" keyboardType="decimal-pad" value={cfg.pts_por_real} onChangeText={(t) => setCfg({ ...cfg, pts_por_real: t })} /></Cell>
        <Cell min={180}><Input label="Nível Prata a partir de (pts em 12 meses)" keyboardType="number-pad" value={cfg.nivel_prata} onChangeText={(t) => setCfg({ ...cfg, nivel_prata: t })} /></Cell>
        <Cell min={180}><Input label="Nível Ouro a partir de (pts em 12 meses)" keyboardType="number-pad" value={cfg.nivel_ouro} onChangeText={(t) => setCfg({ ...cfg, nivel_ouro: t })} /></Cell>
        <Cell><Input label="Validade dos pontos (meses)" keyboardType="number-pad" value={cfg.validade_meses} onChangeText={(t) => setCfg({ ...cfg, validade_meses: t })} /></Cell>
      </Frm>
      <View style={{ alignItems: 'flex-start' }}><Btn title="Salvar regra" onPress={salvarRegra} /></View>
      <Box tone="note">Bônus por nível: Bronze 1×, Prata 1,25×, Ouro 1,5×. Produtos marcados com “2× pontos” no catálogo valem o dobro. Pontos entram quando o pedido é entregue ou quando o cliente confirma o código no balcão.</Box>
      <Txt k="sec">Prêmios</Txt>
      <Frm>
        <Cell grow={2} min={200}><Input label="Nome do prêmio" value={f.nome} onChangeText={(t) => setF({ ...f, nome: t })} placeholder="Ex.: Fardo de refrigerante" /></Cell>
        <Cell><Select label="Categoria" value={f.categoria} options={CATS} onChange={(v) => setF({ ...f, categoria: v })} /></Cell>
        <Cell min={100}><Input label="Custo (pts)" keyboardType="number-pad" value={f.custo} onChangeText={(t) => setF({ ...f, custo: t })} placeholder="500" /></Cell>
        <Btn kind="acc" title="Adicionar" onPress={add} />
      </Frm>
      {l.length === 0 && <Txt k="sub">Nenhum prêmio cadastrado.</Txt>}
      {l.map((r) => (
        <Row key={r.id}>
          <Txt k="b" style={{ flex: wide ? 1 : undefined }}>{r.nome}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt k="mini">Custo (pts)</Txt>
            <CustoCell r={r} onSave={(v) => upd(r, { custo: v })} />
          </View>
          <Txt k="sub">Cliente precisa gastar {brl(r.custo / ppr)}</Txt>
          <Pill tone={r.ativo ? 'entregue' : 'cancelado'} text={r.ativo ? 'Ativo' : 'Pausado'} onPress={() => upd(r, { ativo: !r.ativo })} />
        </Row>
      ))}
      <Box tone="note">Dica: mantenha o valor de custo do prêmio perto de 3–5% do que o cliente precisa gastar para ganhá-lo.</Box>
    </>
  );
}
