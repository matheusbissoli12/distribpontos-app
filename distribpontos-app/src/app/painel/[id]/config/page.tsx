'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { useToast } from '@/components/ui';
import { errMsg, parseMoney } from '@/lib/format';
import type { Area, Bairro } from '@/lib/types';
import { usePanel } from '../PanelContext';

export default function Config() {
  const { d, members, userId, reload } = usePanel();
  const toast = useToast();
  const [f, setF] = useState({
    horario_abre: d.horario_abre.slice(0, 5), horario_fecha: d.horario_fecha.slice(0, 5), pedido_minimo: String(d.pedido_minimo).replace('.', ','),
    frete_gratis_acima: String(d.frete_gratis_acima).replace('.', ','), prazo_texto: d.prazo_texto, segmento: d.segmento, cor: d.cor,
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [nb, setNb] = useState({ bairro: '', taxa: '' });
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
    const r = await fetch('/api/equipe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ distId: d.id, ...conv }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(j.error ?? 'Não foi possível convidar.');
    toast(j.convidado ? 'Convite enviado por e-mail' : 'Pessoa adicionada à equipe');
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
    const r = await fetch('/api/mercadopago', { method: desligar ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ distId: d.id, token: mp.trim() }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(j.error ?? 'Não foi possível conectar.');
    toast(desligar ? 'Pix desligado' : `Mercado Pago conectado${j.conta ? ` (${j.conta})` : ''}`);
    setMp('');
    reload();
  }

  const livres = bairros.filter((b) => !areas.some((a) => a.bairro_id === b.id));
  const nomeB = (id: number) => { const b = bairros.find((x) => x.id === id); return b ? `${b.nome} · ${b.cidade}` : `#${id}`; };

  return (
    <>
      <p className="sec">Funcionamento</p>
      <div className="cfg">
        <div className="field">Recebendo pedidos<button className={`sw ${d.pausada ? '' : 'on'}`} style={{ marginTop: 6 }} onClick={pausar}><i />{d.pausada ? 'Pausado' : 'Sim'}</button></div>
        <label className="field">Abre às<input type="time" value={f.horario_abre} onChange={(e) => setF({ ...f, horario_abre: e.target.value })} /></label>
        <label className="field">Fecha às<input type="time" value={f.horario_fecha} onChange={(e) => setF({ ...f, horario_fecha: e.target.value })} /></label>
        <label className="field">Pedido mínimo (R$)<input inputMode="decimal" value={f.pedido_minimo} onChange={(e) => setF({ ...f, pedido_minimo: e.target.value })} /></label>
        <label className="field">Frete grátis acima de (R$, 0 = não)<input inputMode="decimal" value={f.frete_gratis_acima} onChange={(e) => setF({ ...f, frete_gratis_acima: e.target.value })} /></label>
        <label className="field">Prazo de entrega<input value={f.prazo_texto} onChange={(e) => setF({ ...f, prazo_texto: e.target.value })} /></label>
        <label className="field">Segmento<input value={f.segmento} onChange={(e) => setF({ ...f, segmento: e.target.value })} /></label>
        <label className="field">Cor da marca<input type="color" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} style={{ height: 42, padding: 4 }} /></label>
      </div>
      <div><button className="abtn" onClick={salvar}>Salvar funcionamento</button></div>

      <p className="sec">Área de entrega</p>
      <div className="tbl">
        <table style={{ minWidth: 420 }}>
          <thead><tr><th>Bairro</th><th className="r">Taxa</th><th></th></tr></thead>
          <tbody>
            {areas.length === 0 && <tr><td colSpan={3} className="sub">Nenhum bairro. Sem bairros, os clientes só conseguem retirar na loja.</td></tr>}
            {areas.map((a) => (
              <tr key={a.bairro_id}>
                <td>{nomeB(a.bairro_id)}</td>
                <td className="r"><input className="table-input num" style={{ width: 90, textAlign: 'right' }} inputMode="decimal" defaultValue={Number(a.taxa).toFixed(2).replace('.', ',')} onBlur={(e) => { const v = parseMoney(e.target.value); if (v >= 0 && v !== Number(a.taxa)) updArea(a, v); }} /></td>
                <td className="r"><button className="lbtn" onClick={() => rmArea(a)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="frm" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
        <label className="lbl">Adicionar bairro<select value={nb.bairro} onChange={(e) => setNb({ ...nb, bairro: e.target.value })}><option value="">Selecione</option>{livres.map((b) => <option key={b.id} value={b.id}>{b.nome} · {b.cidade}</option>)}</select></label>
        <label className="lbl">Taxa (R$)<input inputMode="decimal" placeholder="0,00" value={nb.taxa} onChange={(e) => setNb({ ...nb, taxa: e.target.value })} /></label>
        <button className="abtn acc" style={{ padding: '10px 14px' }} onClick={addArea}>Adicionar</button>
      </div>
      <p className="mini">Falta algum bairro na lista? Peça ao administrador da plataforma para cadastrar.</p>

      <p className="sec">Equipe e permissões</p>
      <div className="tbl">
        <table style={{ minWidth: 520 }}>
          <thead><tr><th>Pessoa</th><th>Função</th><th>Pode</th><th></th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td><b>{m.nome || '—'}</b><div className="mini">{m.email}</div></td>
                <td>{m.role}</td>
                <td className="mini">{m.role === 'dono' ? 'Tudo' : m.role === 'caixa' ? 'Pedidos, balcão e clientes' : 'Só as próprias entregas'}</td>
                <td className="r">{m.user_id !== userId && <button className="lbtn" onClick={() => remover(m.user_id)}>Remover</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="frm" style={{ gridTemplateColumns: '1.3fr 1.6fr 1fr auto' }}>
        <label className="lbl">Nome<input value={conv.nome} onChange={(e) => setConv({ ...conv, nome: e.target.value })} /></label>
        <label className="lbl">E-mail<input type="email" value={conv.email} onChange={(e) => setConv({ ...conv, email: e.target.value })} /></label>
        <label className="lbl">Função<select value={conv.role} onChange={(e) => setConv({ ...conv, role: e.target.value })}><option value="caixa">Caixa</option><option value="entregador">Entregador</option><option value="dono">Dono</option></select></label>
        <button className="abtn acc" style={{ padding: '10px 14px' }} disabled={busy} onClick={convidar}>Convidar</button>
      </div>

      <p className="sec">Pix pelo app (Mercado Pago)</p>
      <div className="box2">
        {d.pix_ativo ? (
          <div className="ordh"><span className="gain" style={{ flex: 1 }}>Pix conectado. O dinheiro dos pedidos cai direto na conta Mercado Pago da loja.</span><button className="abtn ghost" disabled={busy} onClick={() => conectarMp(true)}>Desligar Pix</button></div>
        ) : (
          <>
            <p className="sub" style={{ margin: 0 }}>No Mercado Pago da loja: Seu negócio › Configurações › Credenciais de produção › copie o <b>Access Token</b> e cole aqui. Ele fica guardado só no servidor.</p>
            <div className="inlineform">
              <label className="lbl">Access Token<input type="password" autoComplete="off" value={mp} onChange={(e) => setMp(e.target.value)} placeholder="APP_USR-..." /></label>
              <button className="abtn acc" disabled={busy || mp.length < 20} onClick={() => conectarMp()}>Conectar</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
