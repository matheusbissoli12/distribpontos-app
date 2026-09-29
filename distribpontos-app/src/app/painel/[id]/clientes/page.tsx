'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { Spinner, TierPill } from '@/components/ui';
import { dataHora, num } from '@/lib/format';
import { usePanel } from '../PanelContext';

type C = { cpf_mask: string; nome: string | null; cadastrado: boolean; saldo: number; acumulado_12m: number; ultima_compra: string | null };

export default function Clientes() {
  const { d } = usePanel();
  const [l, setL] = useState<C[] | null>(null);
  useEffect(() => { sb().rpc('dist_customers', { p_dist: d.id }).then(({ data }) => setL((data as C[]) ?? [])); }, [d.id]);
  if (!l) return <Spinner />;
  const nivel = (a: number) => (a >= d.nivel_ouro ? 'Ouro' : a >= d.nivel_prata ? 'Prata' : 'Bronze');
  return (
    <>
      <div className="tbl">
        <table style={{ minWidth: 720 }}>
          <thead><tr><th>Cliente</th><th>CPF</th><th>Nível</th><th className="r">Saldo</th><th className="r">Acum. 12m</th><th>Última compra</th><th>Status</th></tr></thead>
          <tbody>
            {l.length === 0 && <tr><td colSpan={7} className="sub">Nenhum cliente com pontos ainda.</td></tr>}
            {l.map((c, i) => (
              <tr key={i}>
                <td><b>{c.nome ?? 'Aguardando cadastro'}</b></td>
                <td className="mono">{c.cpf_mask}</td>
                <td><TierPill nivel={nivel(c.acumulado_12m)} /></td>
                <td className="r num">{num(c.saldo)}</td>
                <td className="r num">{num(c.acumulado_12m)}</td>
                <td className="num">{c.ultima_compra ? dataHora(c.ultima_compra) : '—'}</td>
                <td>{c.cadastrado ? <span className="tag bl">App</span> : <span className="tag">Só balcão</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">O CPF aparece mascarado (LGPD). Clientes “só balcão” ganharam pontos no caixa mas ainda não baixaram o app: vale lembrar no atendimento.</div>
    </>
  );
}
