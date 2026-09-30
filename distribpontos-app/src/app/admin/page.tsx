'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { Logo, Spinner, useToast } from '@/components/ui';
import { brl, dataHora, errMsg, maskCnpj, onlyDigits } from '@/lib/format';
import type { Bairro, Distributor } from '@/lib/types';

const PLANOS: Record<string, number> = { Essencial: 199, Pro: 399, Rede: 799 };
type L = { id: number; nome: string | null; cpf: string | null; tipo: string; status: string; created_at: string };

export default function Admin() {
  const router = useRouter();
  const toast = useToast();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'dists' | 'bairros' | 'lgpd'>('dists');
  const [ds, setDs] = useState<Distributor[]>([]);
  const [counts, setCounts] = useState<Record<string, { prods: number; areas: number }>>({});
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [lgpd, setLgpd] = useState<L[]>([]);
  const [f, setF] = useState({ nome: '', cnpj: '', cidade: '', bairro: '', plano: 'Essencial', donoNome: '', donoEmail: '' });
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
    const c: Record<string, { prods: number; areas: number }> = {};
    ((p.data as { distributor_id: string }[]) ?? []).forEach((x) => { (c[x.distributor_id] ??= { prods: 0, areas: 0 }).prods++; });
    ((a.data as { distributor_id: string }[]) ?? []).forEach((x) => { (c[x.distributor_id] ??= { prods: 0, areas: 0 }).areas++; });
    setCounts(c);
    setBairros((b.data as Bairro[]) ?? []);
    setLgpd((l.data as L[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb().auth.getUser();
      if (!u.user) return router.replace('/painel/login');
      const { data } = await sb().rpc('is_admin');
      setOk(!!data);
      if (data) load();
    })();
  }, [router, load]);

  async function criar() {
    if (!f.nome.trim() || onlyDigits(f.cnpj).length !== 14 || !f.cidade.trim()) return toast('Preencha nome, CNPJ (14 números) e cidade.');
    if (!f.donoEmail.includes('@')) return toast('Informe o e-mail do dono para enviar o convite.');
    setBusy(true);
    const r = await fetch('/api/admin/distribuidoras', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, cnpj: onlyDigits(f.cnpj) }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(j.error ?? 'Não foi possível cadastrar.');
    toast('Distribuidora cadastrada e convite enviado ao dono');
    setF({ nome: '', cnpj: '', cidade: '', bairro: '', plano: 'Essencial', donoNome: '', donoEmail: '' });
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

  if (ok === null) return <Spinner />;
  if (!ok) return <div className="pwrap"><div className="err">Acesso restrito ao administrador da plataforma.</div><Link className="abtn ghost" href="/painel">Voltar</Link></div>;
  const ativas = ds.filter((d) => d.status === 'ativa');
  const mrr = ativas.reduce((a, d) => a + (PLANOS[d.plano] ?? 0), 0);

  return (
    <div className="pwrap">
      <div className="ptop"><h1>Distrib<b>Pontos</b> · Admin</h1><div className="row-actions"><Link className="abtn ghost" href="/painel">Painéis</Link><button className="abtn ghost" onClick={async () => { await sb().auth.signOut(); router.replace('/painel/login'); }}>Sair</button></div></div>
      <div className="panel">
        <div className="kpis num">
          <div className="kpi"><span>Distribuidoras no ar</span><b>{ativas.length} <span className="sub" style={{ fontFamily: 'var(--body)', fontSize: 12 }}>de {ds.length}</span></b></div>
          <div className="kpi"><span>Receita mensal (planos)</span><b>{brl(mrr)}</b></div>
          <div className="kpi"><span>Em implantação</span><b>{ds.filter((d) => d.status === 'implantacao').length}</b></div>
          <div className="kpi"><span>Pedidos LGPD pendentes</span><b>{lgpd.filter((l) => l.status === 'pendente').length}</b></div>
        </div>
        <div className="ptabs">
          {([['dists', 'Distribuidoras e contratos'], ['bairros', 'Bairros'], ['lgpd', 'LGPD']] as const).map(([k, t]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
        <div className="pbody">
          {tab === 'dists' && (
            <>
              <div className="tbl">
                <table style={{ minWidth: 900 }}>
                  <thead><tr><th>Distribuidora</th><th>Plano</th><th className="r">Produtos</th><th className="r">Bairros</th><th>Contrato</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {ds.map((d) => (
                      <tr key={d.id}>
                        <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Logo nome={d.nome} cor={d.cor} size={34} /><div><b>{d.nome}</b><div className="mini">{d.cidade} · CNPJ {maskCnpj(d.cnpj)}</div></div></div></td>
                        <td><select className="sel" value={d.plano} onChange={(e) => upd(d, e.target.value, null)}>{Object.entries(PLANOS).map(([p, v]) => <option key={p} value={p}>{p} · {brl(v)}</option>)}</select></td>
                        <td className="r num">{counts[d.id]?.prods ?? 0}</td>
                        <td className="r num">{counts[d.id]?.areas ?? 0}</td>
                        <td><button className={`sw ${d.contrato_assinado ? 'on' : ''}`} onClick={() => upd(d, null, !d.contrato_assinado)}><i />{d.contrato_assinado ? 'Assinado' : 'Pendente'}</button></td>
                        <td><span className={`pill ${d.status === 'ativa' ? 'st-entregue' : d.status === 'implantacao' ? 'st-separando' : 'st-cancelado'}`}>{d.status === 'ativa' ? 'No ar' : d.status === 'implantacao' ? 'Implantação' : 'Suspensa'}</span></td>
                        <td className="r">{d.status === 'ativa' ? <button className="abtn ghost" onClick={() => status(d, 'suspensa')}>Suspender</button> : <button className="abtn" onClick={() => status(d, 'ativa')}>Colocar no ar</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="sec">Novo contrato</p>
              <div className="frm" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <label className="lbl">Nome fantasia<input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
                <label className="lbl">CNPJ<input inputMode="numeric" value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: maskCnpj(e.target.value) })} placeholder="00.000.000/0000-00" /></label>
                <label className="lbl">Cidade<input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></label>
                <label className="lbl">Bairro da loja<input value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} /></label>
                <label className="lbl">Plano<select value={f.plano} onChange={(e) => setF({ ...f, plano: e.target.value })}>{Object.entries(PLANOS).map(([p, v]) => <option key={p} value={p}>{p} · {brl(v)}/mês</option>)}</select></label>
                <label className="lbl">Nome do dono<input value={f.donoNome} onChange={(e) => setF({ ...f, donoNome: e.target.value })} /></label>
                <label className="lbl">E-mail do dono<input type="email" value={f.donoEmail} onChange={(e) => setF({ ...f, donoEmail: e.target.value })} /></label>
                <button className="abtn acc" style={{ padding: '10px 14px' }} disabled={busy} onClick={criar}>Cadastrar e convidar</button>
              </div>
              <div className="note">Fluxo: cadastre aqui (fica “Em implantação”) → o dono recebe o convite por e-mail, cria a senha e monta catálogo, bairros e prêmios → marque o contrato como assinado → “Colocar no ar”.</div>
            </>
          )}
          {tab === 'bairros' && (
            <>
              <div className="inlineform">
                <label className="lbl">Bairro<input value={nb.nome} onChange={(e) => setNb({ ...nb, nome: e.target.value })} /></label>
                <label className="lbl">Cidade<input value={nb.cidade} onChange={(e) => setNb({ ...nb, cidade: e.target.value })} /></label>
                <button className="abtn acc" onClick={addBairro}>Adicionar</button>
              </div>
              <div className="fr">{bairros.map((b) => <span key={b.id} className="chip">{b.nome} · {b.cidade}</span>)}</div>
            </>
          )}
          {tab === 'lgpd' && (
            <>
              {lgpd.length === 0 && <p className="sub">Nenhuma solicitação.</p>}
              {lgpd.map((l) => (
                <div key={l.id} className="ext">
                  <span><b>{l.nome ?? 'Cliente'}</b> · {l.tipo === 'copia' ? 'Cópia dos dados' : 'Exclusão da conta'}<br /><span className="mini">{dataHora(l.created_at)} · prazo de 15 dias</span></span>
                  {l.status === 'pendente' ? <button className="abtn ghost" onClick={() => concluir(l)}>Marcar concluída</button> : <span className="pill st-entregue">Concluída</span>}
                </div>
              ))}
              <div className="note">Exclusão: apague o usuário em Supabase › Authentication › Users (o perfil sai junto) e depois marque como concluída. Cópia: exporte os dados do cliente e envie para o e-mail dele.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
