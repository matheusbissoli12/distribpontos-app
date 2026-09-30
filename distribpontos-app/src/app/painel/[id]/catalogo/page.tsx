'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { Spinner, useToast } from '@/components/ui';
import { CATEGORIAS, errMsg, parseMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import { usePanel } from '../PanelContext';

const EXEMPLO = 'nome;categoria;unidade;preço;estoque\nCerveja Pilsen lata 350ml;Cervejas;lata;4,49;240\nÁgua mineral galão 20L;Águas;galão (troca);16,00;35';

export default function Catalogo() {
  const { d } = usePanel();
  const toast = useToast();
  const [l, setL] = useState<Product[] | null>(null);
  const [f, setF] = useState({ nome: '', categoria: 'Cervejas', unidade: '', preco: '', estoque: '' });
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
      const c = line.split(/[;\t]/).map((x) => x.trim());
      if (i === 0 && /^nome$/i.test(c[0])) return;
      const [nome, cat, un, pr, est] = c;
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
  function arquivo(file: File | undefined) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setImp(String(r.result ?? ''));
    r.readAsText(file);
  }

  if (!l) return <Spinner />;
  const baixo = l.filter((p) => p.ativo && p.estoque <= 5);
  const vis = l.filter((p) => !q.trim() || p.nome.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      {baixo.length > 0 && <div className="alert"><b>Estoque baixo:</b> {baixo.map((p) => `${p.nome} (${p.estoque})`).join(', ')}. Com estoque 0 o produto aparece esgotado no app.</div>}
      <p className="sec">Adicionar produto</p>
      <div className="frm" style={{ gridTemplateColumns: '2fr 1.2fr 1fr .8fr .7fr auto' }}>
        <label className="lbl">Nome<input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Cerveja Pilsen 600ml" /></label>
        <label className="lbl">Categoria<select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="lbl">Unidade<input value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} placeholder="garrafa, fardo 12" /></label>
        <label className="lbl">Preço (R$)<input inputMode="decimal" value={f.preco} onChange={(e) => setF({ ...f, preco: e.target.value })} placeholder="0,00" /></label>
        <label className="lbl">Estoque<input inputMode="numeric" value={f.estoque} onChange={(e) => setF({ ...f, estoque: e.target.value })} placeholder="0" /></label>
        <button className="abtn acc" style={{ padding: '10px 14px' }} onClick={add}>Adicionar</button>
      </div>
      <details>
        <summary>Importar vários produtos de uma planilha</summary>
        <div className="box2" style={{ marginTop: 8 }}>
          <p className="sub" style={{ margin: 0 }}>Cole as linhas (colunas: nome; categoria; unidade; preço; estoque) ou escolha um .csv exportado do Excel ou do seu sistema.</p>
          <textarea className="txt" style={{ minHeight: 120, fontFamily: 'var(--mono)', fontSize: 12 }} value={imp} onChange={(e) => setImp(e.target.value)} />
          <div className="fr" style={{ alignItems: 'center' }}><input type="file" accept=".csv,.txt" onChange={(e) => arquivo(e.target.files?.[0])} aria-label="Arquivo CSV" /><button className="abtn acc" onClick={importar}>Importar</button></div>
          {impMsg && <div className="note">{impMsg}</div>}
        </div>
      </details>
      <div className="ordh"><p className="sec">Catálogo ({l.length} produtos)</p><input className="search" style={{ maxWidth: 260 }} placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="tbl">
        <table style={{ minWidth: 860 }}>
          <thead><tr><th>Produto</th><th>Categoria</th><th>Unidade</th><th className="r">Preço</th><th className="r">Estoque</th><th>2× pontos</th><th>No app</th><th></th></tr></thead>
          <tbody>
            {vis.map((p) => (
              <tr key={p.id}>
                <td><input className="table-input" defaultValue={p.nome} onBlur={(e) => e.target.value.trim() && e.target.value !== p.nome && upd(p, { nome: e.target.value.trim() })} /></td>
                <td><select className="table-input" value={p.categoria} onChange={(e) => upd(p, { categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></td>
                <td><input className="table-input" defaultValue={p.unidade} onBlur={(e) => e.target.value !== p.unidade && upd(p, { unidade: e.target.value || 'unidade' })} /></td>
                <td className="r"><input className="table-input num" style={{ width: 90, textAlign: 'right' }} inputMode="decimal" defaultValue={Number(p.preco).toFixed(2).replace('.', ',')} onBlur={(e) => { const v = parseMoney(e.target.value); if (v > 0 && v !== Number(p.preco)) upd(p, { preco: v }); }} /></td>
                <td className="r"><input className="table-input num" style={{ width: 70, textAlign: 'right', ...(p.estoque <= 5 ? { borderColor: 'var(--warn)', color: 'var(--warn)' } : {}) }} inputMode="numeric" defaultValue={p.estoque} onBlur={(e) => { const v = parseInt(e.target.value); if (v >= 0 && v !== p.estoque) upd(p, { estoque: v }); }} /></td>
                <td><button className={`sw ${p.pontos_dobro ? 'on' : ''}`} onClick={() => upd(p, { pontos_dobro: !p.pontos_dobro })}><i />{p.pontos_dobro ? 'Sim' : 'Não'}</button></td>
                <td><button className={`pill ${p.ativo ? 'st-entregue' : 'st-cancelado'}`} onClick={() => upd(p, { ativo: !p.ativo })}>{p.ativo ? 'Visível' : 'Oculto'}</button></td>
                <td className="r"><button className="lbtn" onClick={() => del(p)}>Apagar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
