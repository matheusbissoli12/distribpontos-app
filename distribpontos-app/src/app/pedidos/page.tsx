'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, StatusPill, Empty } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { brl, dataHora, num } from '@/lib/format';
import type { Order } from '@/lib/types';
import { useSession } from '@/components/useSession';

export default function Pedidos() {
  const { profile } = useSession();
  const [lista, setLista] = useState<Order[] | null>(null);
  useEffect(() => {
    if (!profile?.cpf) return;
    sb().from('orders').select('*, order_items(*), distributors(nome, cor)').eq('cpf', profile.cpf)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setLista((data as Order[]) ?? []));
  }, [profile?.cpf]);
  return (
    <AppShell requireLogin>
      <h2 className="h2">Meus pedidos e compras</h2>
      {lista === null ? <Spinner /> : lista.length === 0 ? <Empty>Nenhum pedido ainda.</Empty> : lista.map((o) => (
        <Link key={o.id} href={`/pedido/${o.id}`} className="card ord">
          <div className="ordh"><div><b className="num">#{o.id}</b> <span className="sub">{dataHora(o.created_at)}</span></div>
            {o.canal === 'balcao' ? <span className="tag bl">Loja física</span> : o.tipo === 'resgate' ? <span className="tag rs">Resgate</span> : <StatusPill status={o.status} />}</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{o.distributors?.nome}</div>
          <div className="sub" style={{ color: 'var(--ink)' }}>{o.canal === 'balcao' ? `Compra na loja${o.cupom ? ' · cupom ' + o.cupom : ''}` : (o.order_items ?? []).map((i) => `${i.qty}× ${i.nome}`).join(' · ')}</div>
          <div className="ordh num"><span>{o.tipo === 'resgate' ? <span className="minus">−{num(o.pontos)} pts</span> : <><b>{brl(o.total)}</b> · <span className="earn">{o.status === 'entregue' ? `+${num(o.pontos)} pts` : o.status === 'cancelado' ? 'sem pontos' : `+${num(o.pontos)} pts na entrega`}</span></>}</span></div>
        </Link>
      ))}
    </AppShell>
  );
}
