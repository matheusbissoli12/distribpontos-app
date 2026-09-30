'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Logo, Spinner, TierPill, Empty } from '@/components/ui';
import { useSession } from '@/components/useSession';
import { sb } from '@/lib/supabase/client';
import { maskCpf, num } from '@/lib/format';
import type { Wallet } from '@/lib/types';

export default function Pontos() {
  const { profile } = useSession();
  const [ws, setWs] = useState<Wallet[] | null>(null);
  useEffect(() => { sb().rpc('my_wallets').then(({ data }) => setWs((data as Wallet[]) ?? [])); }, [profile?.cpf]);
  const tot = (ws ?? []).reduce((a, w) => a + w.saldo, 0);
  return (
    <AppShell requireLogin>
      <div className="wallet">
        <span style={{ fontSize: 13, opacity: 0.9 }}>Total em pontos</span>
        <div className="big num">{num(tot)}<small>pts</small></div>
        <div className="meta"><span>em {ws?.length ?? 0} {ws?.length === 1 ? 'distribuidora' : 'distribuidoras'}</span><span>CPF {maskCpf(profile?.cpf ?? '')}</span></div>
      </div>
      {(ws ?? []).filter((w) => w.vence_30d > 0).map((w) => (
        <div key={w.distributor_id} className="alert"><b>{num(w.vence_30d)} pts vencem nos próximos 30 dias</b> na {w.nome}. Troque antes de perder.</div>
      ))}
      <p className="sub" style={{ margin: 0 }}>Cada distribuidora tem seus próprios pontos e prêmios. Toque para ver e trocar.</p>
      {ws === null ? <Spinner /> : ws.length === 0 ? <Empty>Você ainda não tem pontos. Faça um pedido ou informe seu CPF no caixa de uma distribuidora parceira.</Empty> : (
        <div className="list">
          {ws.map((w) => (
            <Link key={w.distributor_id} className="dcard" href={`/pontos/${w.distributor_id}`}>
              <Logo nome={w.nome} cor={w.cor} />
              <div><div className="nm">{w.nome}</div><div className="ds" style={{ marginTop: 3 }}><TierPill nivel={w.nivel} />{w.pendente > 0 && <span className="earn" style={{ fontSize: 12 }}> +{num(w.pendente)} a creditar</span>}</div></div>
              <div className="mypts"><b className="num">{num(w.saldo)}</b>pts</div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
