'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { useToast } from '@/components/ui';
import { brl, cpfValid, errMsg, hora, maskCel, maskCpf, num, onlyDigits, parseMoney } from '@/lib/format';
import type { Order } from '@/lib/types';
import { usePanel } from '../PanelContext';

type Pend = { codeId: string; pts: number; nome: string | null; registrado: boolean; celular: string; devCode?: string; cpf: string; valor: number };

export default function Balcao() {
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
    const r = await fetch('/api/balcao', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ distId: d.id, cpf: onlyDigits(cpf), valor: v, cupom, celular: onlyDigits(cel) }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? 'Não foi possível enviar o código.');
    setPend({ ...j, cpf: onlyDigits(cpf), valor: v });
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
    <div className="pdv">
      {pend ? (
        <div className="box">
          <h3 className="h2">Confirmação do cliente</h3>
          <p className="sub" style={{ margin: 0 }}>Enviamos um código para {pend.celular}{pend.registrado ? ' (SMS e app)' : ' (SMS)'}. Peça ao cliente para dizer o código.</p>
          <div className="lookup"><b>{pend.registrado ? pend.nome : 'Cliente sem cadastro no app'}</b> · {maskCpf(pend.cpf)}<br />Compra de <b className="num">{brl(pend.valor)}</b> → <b className="num">+{num(pend.pts)} pts</b></div>
          <label className="lbl">Código de 4 dígitos<input inputMode="numeric" maxLength={4} placeholder="0000" value={code} onChange={(e) => setCode(onlyDigits(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && confirmar()} /></label>
          {pend.devCode && <div className="hint">Modo de teste (SMS desligado): o código é <b className="mono">{pend.devCode}</b></div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => setPend(null)}>Cancelar</button>
            <button className="btn acc" disabled={busy || code.length !== 4} onClick={confirmar}>Confirmar e lançar</button>
          </div>
        </div>
      ) : (
        <div className="box">
          <h3 className="h2">Lançar compra da loja física</h3>
          <label className="lbl">CPF do cliente<input inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} /></label>
          <label className="lbl">Valor da compra (R$)<input inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} /></label>
          <label className="lbl">Nº do cupom fiscal (opcional)<input autoComplete="off" value={cupom} onChange={(e) => setCupom(e.target.value)} /></label>
          <label className="lbl">Celular do cliente (se ele ainda não tem o app)<input inputMode="tel" placeholder="(27) 99999-9999" value={cel} onChange={(e) => setCel(maskCel(e.target.value))} /></label>
          {previa !== null && <div className="gain">Cliente ganha cerca de <b className="num">+{num(previa)} pts</b> (mais bônus do nível dele).</div>}
          {err && <div className="err">{err}</div>}
          <button className="btn acc" disabled={busy} onClick={enviar}>{busy ? 'Enviando…' : 'Enviar código de confirmação'}</button>
        </div>
      )}
      <div className="box">
        <h3 className="h2">Últimos lançamentos</h3>
        {hist.length === 0 && <p className="sub">Nenhum lançamento ainda.</p>}
        {hist.map((o) => (
          <div key={o.id} className="ext num"><span><b>{o.cliente_nome || 'Cliente sem cadastro'}</b><br /><span className="sub">{hora(o.created_at)} · {brl(o.total)}{o.cupom ? ` · cupom ${o.cupom}` : ''}</span></span><span className="plus">+{num(o.pontos)}</span></div>
        ))}
        <div className="note">Cada lançamento só vale depois que o cliente confirma o código recebido no celular. Isso impede que alguém lance pontos no próprio CPF.</div>
      </div>
    </div>
  );
}
