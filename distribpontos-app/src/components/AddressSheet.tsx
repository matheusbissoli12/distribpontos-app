'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { getEndereco, setEndereco } from '@/lib/cart';
import type { Bairro } from '@/lib/types';

export function AddressSheet({ onClose }: { onClose: () => void }) {
  const atual = getEndereco();
  const e = atual && !atual.retirada ? atual : null;
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroId, setBairroId] = useState<string>(e ? String(e.bairro_id) : '');
  const [rua, setRua] = useState(e?.rua ?? '');
  const [comp, setComp] = useState(e?.comp ?? '');
  const [err, setErr] = useState('');

  useEffect(() => {
    sb().from('bairros').select('*').order('cidade').order('nome').then(({ data }) => setBairros((data as Bairro[]) ?? []));
  }, []);

  function salvar() {
    const b = bairros.find((x) => String(x.id) === bairroId);
    if (!b) return setErr('Selecione o bairro.');
    if (rua.trim().length < 4) return setErr('Informe rua e número.');
    setEndereco({ bairro_id: b.id, bairro: b.nome, cidade: b.cidade, rua: rua.trim(), comp: comp.trim() });
    onClose();
  }

  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Endereço de entrega">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h2">Onde vamos entregar?</h2>
          <p className="sub" style={{ margin: 0 }}>Informe o endereço deste pedido para ver as distribuidoras que atendem você.</p>
          <label className="lbl">
            Bairro
            <select className="inp" value={bairroId} onChange={(ev) => setBairroId(ev.target.value)}>
              <option value="" disabled>Selecione o bairro</option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome} · {b.cidade}</option>
              ))}
            </select>
          </label>
          <label className="lbl">
            Rua e número
            <input className="inp" autoComplete="street-address" placeholder="Ex.: Rua das Palmeiras, 45" value={rua} onChange={(ev) => setRua(ev.target.value)} />
          </label>
          <label className="lbl">
            Complemento (opcional)
            <input className="inp" placeholder="Apto, bloco, referência" value={comp} onChange={(ev) => setComp(ev.target.value)} />
          </label>
          {err && <div className="err">{err}</div>}
          <button className="btn" onClick={salvar}>Confirmar endereço</button>
          <button className="btn ghost" onClick={() => { setEndereco({ retirada: true }); onClose(); }}>Prefiro retirar na loja</button>
          <button className="sub" style={{ textDecoration: 'underline' }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </>
  );
}
