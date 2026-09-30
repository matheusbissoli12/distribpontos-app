import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand, Cell, Frm, PWrap, Row, useWide } from '@/components/panel';
import { Box, Btn, Card, Input, Logo, Pill, Select, Spinner, Switch, Txt, useToast } from '@/components/ui';
import { api, sb } from '@/lib/supabase';
import { brl, dataHora, errMsg, maskCnpj, onlyDigits } from '@/lib/format';
import { F, useColors } from '@/lib/theme';
import type { Bairro, Distributor } from '@/lib/types';

const PLANOS: Record<string, number> = { Essencial: 199, Pro: 399, Rede: 799 };
type L = { id: number; nome: string | null; cpf: string | null; tipo: string; status: string; created_at: string };
const VAZIO = { nome: '', cnpj: '', cidade: '', bairro: '', plano: 'Essencial', donoNome: '', donoEmail: '' };

export default function Admin() {
  const c = useColors();
  const wide = useWide();
  const toast = useToast();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'dists' | 'bairros' | 'lgpd'>('dists');
  const [ds, setDs] = useState<Distributor[]>([]);
  const [counts, setCounts] = useState<Record<string, { prods: number; areas: number }>>({});
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [lgpd, setLgpd] = useState<L[]>([]);
  const [f, setF] = useState(VAZIO);
  const [nb, setNb] = useState({ nome: '', cidade: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, p, a, b, l] = await Promise.all([
      sb().from('distributors').select('*').order('created_at'),
      sb().from('products').select('distributor_id').eq('ativo', true),
      sb().from('delivery_areas').select('distributor_id'),
      sb().from('bairros').select('*').order('cidade').order('nome'),
      sb().from('lgpd_requests').select('*').order('created_at', { ascending: false }),
    ]);
    setDs((d.data as Distributor[]) ?? []);
    const cnt: Record<string, { prods: number; areas: number }> = {};
    ((p.data as { distributor_id: string }[]) ?? []).forEach((x) => { (cnt[x.distributor_id] ??= { prods: 0, areas: 0 }).prods++; });
    ((a.data as { distributor_id: string }[]) ?? []).forEach((x) => { (cnt[x.distributor_id] ??= { prods: 0, areas: 0 }).areas++; });
    setCounts(cnt);
    setBairros((b.data as Bairro[]) ?? []);
    setLgpd((l.data as L[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: s } = await sb().auth.getSession();
      if (!s.session) return router.replace('/painel/login');
      const { data } = await sb().rpc('is_admin');
      setOk(!!data);
      if (data) load();
    })();
  }, [load]);

  async function criar() {
    if (!f.nome.trim() || onlyDigits(f.cnpj).length !== 14 || !f.cidade.trim()) return toast('Preencha nome, CNPJ (14 números) e cidade.');
    if (!f.donoEmail.includes('@')) return toast('Informe o e-mail do dono para enviar o convite.');
    setBusy(true);
    const r = await api('/api/admin/distribuidoras', { body: { ...f, cnpj: onlyDigits(f.cnpj) } });
    setBusy(false);
    if (!r.ok) return toast(r.data.error ?? 'Não foi possível cadastrar.');
    toast('Distribuidora cadastrada e convite enviado ao dono');
    setF(VAZIO);
    load();
  }
  async function status(d: Distributor, s: string) {
    const { error } = await sb().rpc('admin_set_status', { p_dist: d.id, p_status: s });
    if (error) return toast(errMsg(error));
    toast(s === 'ativa' ? `${d.nome} está no ar` : `${d.nome} suspensa`);
    load();
  }
  async function upd(d: Distributor, plano: string | null, contrato: boolean | null) {
    const { error } = await sb().rpc('admin_update_distributor', { p_dist: d.id, p_plano: plano, p_contrato: contrato });
    if (error) return toast(errMsg(error));
    load();
  }
  async function addBairro() {
    if (!nb.nome.trim() || !nb.cidade.trim()) return toast('Informe bairro e cidade.');
    const { error } = await sb().from('bairros').insert({ nome: nb.nome.trim(), cidade: nb.cidade.trim() });
    if (error) return toast(errMsg(error));
    setNb({ nome: '', cidade: nb.cidade });
    load();
  }
  async function concluir(l: L) {
    const { error } = await sb().from('lgpd_requests').update({ status: 'concluida' }).eq('id', l.id);
    if (error) return toast(errMsg(error));
    load();
  }
  async function sair() {
    await sb().auth.signOut();
    router.replace('/painel/login');
  }

  if (ok === null) return <PWrap><Spinner /></PWrap>;
  if (!ok) return <PWrap max={560}><Box tone="err">Acesso restrito ao administrador da plataforma.</Box><Btn kind="ghost" title="Voltar" onPress={() => router.replace('/painel')} /></PWrap>;
  const ativas = ds.filter((d) => d.status === 'ativa');
  const mrr = ativas.reduce((a, d) => a + (PLANOS[d.plano] ?? 0), 0);
  const planos = Object.entries(PLANOS).map(([p, v]) => ({ value: p, label: `${p} · ${brl(v)}/mês` }));
  const kpis: [string, string, string?][] = [
    ['Distribuidoras no ar', String(ativas.length), `de ${ds.length}`],
    ['Receita mensal (planos)', brl(mrr)],
    ['Em implantação', String(ds.filter((d) => d.status === 'implantacao').length)],
    ['Pedidos LGPD pendentes', String(lgpd.filter((l) => l.status === 'pendente').length)],
  ];

  return (
    <PWrap>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Brand suffix="Admin" />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Btn small kind="ghost" title="Painéis" onPress={() => router.replace('/painel')} />
          <Btn small kind="ghost" title="Sair" onPress={sair} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {kpis.map(([k, v, s]) => (
          <View key={k} style={{ flexGrow: 1, flexBasis: wide ? 200 : 140, backgroundColor: c.surface, borderRadius: 12, padding: 12, gap: 2 }}>
            <Txt k="mini">{k}</Txt>
            <Text style={{ fontFamily: F.disp, fontSize: 26, color: c.ink }}>{v}{s ? <Text style={{ fontFamily: F.body, fontSize: 12, color: c.muted }}> {s}</Text> : null}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.line, flexWrap: 'wrap' }}>
        {([['dists', 'Distribuidoras e contratos'], ['bairros', 'Bairros'], ['lgpd', 'LGPD']] as const).map(([k, t]) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: tab === k ? c.accent : 'transparent' }}>
            <Text style={{ fontFamily: tab === k ? F.bodySemi : F.bodyMed, color: tab === k ? c.ink : c.muted }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'dists' && (
        <>
          {ds.length === 0 && <Txt k="sub">Nenhuma distribuidora cadastrada.</Txt>}
          {ds.map((d) => (
            <Row key={d.id}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flex: wide ? 2 : undefined, minWidth: 200 }}>
                <Logo nome={d.nome} cor={d.cor} size={34} />
                <View style={{ flexShrink: 1 }}><Txt k="b">{d.nome}</Txt><Txt k="mini">{d.cidade} · CNPJ {maskCnpj(d.cnpj)}</Txt></View>
              </View>
              <View style={{ minWidth: 170 }}><Select compact value={d.plano} options={planos} onChange={(v) => upd(d, v, null)} /></View>
              <Txt k="sub" style={{ minWidth: 120 }}>{counts[d.id]?.prods ?? 0} produtos · {counts[d.id]?.areas ?? 0} bairros</Txt>
              <Switch on={d.contrato_assinado} onPress={() => upd(d, null, !d.contrato_assinado)} labelOn="Assinado" labelOff="Pendente" />
              <Pill tone={d.status} text={d.status === 'ativa' ? 'No ar' : d.status === 'implantacao' ? 'Implantação' : 'Suspensa'} />
              {d.status === 'ativa'
                ? <Btn small kind="ghost" title="Suspender" onPress={() => status(d, 'suspensa')} />
                : <Btn small title="Colocar no ar" onPress={() => status(d, 'ativa')} />}
            </Row>
          ))}
          <Txt k="sec">Novo contrato</Txt>
          <Card>
            <Frm>
              <Cell><Input label="Nome fantasia" value={f.nome} onChangeText={(t) => setF({ ...f, nome: t })} /></Cell>
              <Cell><Input label="CNPJ" keyboardType="number-pad" value={f.cnpj} onChangeText={(t) => setF({ ...f, cnpj: maskCnpj(t) })} placeholder="00.000.000/0000-00" /></Cell>
              <Cell><Input label="Cidade" value={f.cidade} onChangeText={(t) => setF({ ...f, cidade: t })} /></Cell>
              <Cell><Input label="Bairro da loja" value={f.bairro} onChangeText={(t) => setF({ ...f, bairro: t })} /></Cell>
            </Frm>
            <Frm>
              <Cell><Select label="Plano" value={f.plano} options={planos} onChange={(v) => setF({ ...f, plano: v })} /></Cell>
              <Cell><Input label="Nome do dono" value={f.donoNome} onChangeText={(t) => setF({ ...f, donoNome: t })} /></Cell>
              <Cell><Input label="E-mail do dono" keyboardType="email-address" autoCapitalize="none" value={f.donoEmail} onChangeText={(t) => setF({ ...f, donoEmail: t })} /></Cell>
              <Btn kind="acc" disabled={busy} title="Cadastrar e convidar" onPress={criar} />
            </Frm>
          </Card>
          <Box tone="note">Fluxo: cadastre aqui (fica “Em implantação”) → o dono recebe o convite por e-mail, cria a senha e monta catálogo, bairros e prêmios → marque o contrato como assinado → “Colocar no ar”.</Box>
        </>
      )}
      {tab === 'bairros' && (
        <>
          <Frm>
            <Cell><Input label="Bairro" value={nb.nome} onChangeText={(t) => setNb({ ...nb, nome: t })} /></Cell>
            <Cell><Input label="Cidade" value={nb.cidade} onChangeText={(t) => setNb({ ...nb, cidade: t })} /></Cell>
            <Btn kind="acc" title="Adicionar" onPress={addBairro} />
          </Frm>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {bairros.map((b) => (
              <View key={b.id} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Txt style={{ fontSize: 12.5 }}>{b.nome} · {b.cidade}</Txt>
              </View>
            ))}
          </View>
        </>
      )}
      {tab === 'lgpd' && (
        <>
          {lgpd.length === 0 && <Txt k="sub">Nenhuma solicitação.</Txt>}
          {lgpd.map((l) => (
            <Row key={l.id}>
              <View style={{ flex: wide ? 1 : undefined }}>
                <Txt><Text style={{ fontFamily: F.bodySemi }}>{l.nome ?? 'Cliente'}</Text> · {l.tipo === 'copia' ? 'Cópia dos dados' : 'Exclusão da conta'}</Txt>
                <Txt k="mini">{dataHora(l.created_at)} · prazo de 15 dias</Txt>
              </View>
              {l.status === 'pendente' ? <Btn small kind="ghost" title="Marcar concluída" onPress={() => concluir(l)} /> : <Pill tone="entregue" text="Concluída" />}
            </Row>
          ))}
          <Box tone="note">Exclusão: apague o usuário em Supabase › Authentication › Users (o perfil sai junto) e depois marque como concluída. Cópia: exporte os dados do cliente e envie para o e-mail dele.</Box>
        </>
      )}
    </PWrap>
  );
}
