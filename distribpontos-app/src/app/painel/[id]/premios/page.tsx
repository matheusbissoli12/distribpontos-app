'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { Spinner, useToast } from '@/components/ui';
import { brl, CATEGORIAS, errMsg } from '@/lib/format';
import type { Reward } from '@/lib/types';
import { usePanel } from '../PanelContext';

export default function Premios() {
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
      <p className="sec">Regra de pontuação</p>
      <div className="cfg">
        <label className="field">Pontos por R$ 1,00<input inputMode="decimal" value={cfg.pts_por_real} onChange={(e) => setCfg({ ...cfg, pts_por_real: e.target.value })} /></label>
        <label className="field">Nível Prata a partir de (pts em 12 meses)<input inputMode="numeric" value={cfg.nivel_prata} onChange={(e) => setCfg({ ...cfg, nivel_prata: e.target.value })} /></label>
        <label className="field">Nível Ouro a partir de (pts em 12 meses)<input inputMode="numeric" value={cfg.nivel_ouro} onChange={(e) => setCfg({ ...cfg, nivel_ouro: e.target.value })} /></label>
        <label className="field">Validade dos pontos (meses)<input inputMode="numeric" value={cfg.validade_meses} onChange={(e) => setCfg({ ...cfg, validade_meses: e.target.value })} /></label>
      </div>
      <div><button className="abtn" onClick={salvarRegra}>Salvar regra</button></div>
      <div className="note">Bônus por nível: Bronze 1×, Prata 1,25×, Ouro 1,5×. Produtos marcados com “2× pontos” no catálogo valem o dobro. Pontos entram quando o pedido é entregue ou quando o cliente confirma o código no balcão.</div>
      <p className="sec">Prêmios</p>
      <div className="frm" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
        <label className="lbl">Nome do prêmio<input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Fardo de refrigerante" /></label>
        <label className="lbl">Categoria<select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="lbl">Custo (pts)<input inputMode="numeric" value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} placeholder="500" /></label>
        <button className="abtn acc" style={{ padding: '10px 14px' }} onClick={add}>Adicionar</button>
      </div>
      <div className="tbl">
        <table>
          <thead><tr><th>Prêmio</th><th className="r">Custo (pts)</th><th className="r">Cliente precisa gastar</th><th>Status</th></tr></thead>
          <tbody>
            {l.length === 0 && <tr><td colSpan={4} className="sub">Nenhum prêmio cadastrado.</td></tr>}
            {l.map((r) => (
              <tr key={r.id}>
                <td>{r.nome}</td>
                <td className="r"><input className="table-input num" style={{ width: 90, textAlign: 'right' }} inputMode="numeric" defaultValue={r.custo} onBlur={(e) => { const v = parseInt(e.target.value); if (v > 0 && v !== r.custo) upd(r, { custo: v }); }} /></td>
                <td className="r num sub">{brl(r.custo / ppr)}</td>
                <td><button className={`pill ${r.ativo ? 'st-entregue' : 'st-cancelado'}`} onClick={() => upd(r, { ativo: !r.ativo })}>{r.ativo ? 'Ativo' : 'Pausado'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">Dica: mantenha o valor de custo do prêmio perto de 3–5% do que o cliente precisa gastar para ganhá-lo.</div>
    </>
  );
}
