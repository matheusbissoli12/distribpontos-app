'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Logo, Spinner, Empty } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { useEndereco } from '@/lib/cart';
import { brl, num } from '@/lib/format';
import { isOpen, openText } from '@/lib/store';
import type { Area, Distributor, Wallet } from '@/lib/types';

export default function Home() {
  const end = useEndereco();
  const [dists, setDists] = useState<Distributor[] | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const [d, a, w] = await Promise.all([
        sb().from('distributors').select('*').eq('status', 'ativa').order('nome'),
        sb().from('delivery_areas').select('*'),
        sb().rpc('my_wallets'),
      ]);
      setDists((d.data as Distributor[]) ?? []);
      setAreas((a.data as Area[]) ?? []);
      setWallets((w.data as Wallet[]) ?? []);
    })();
  }, []);

  const bairroId = end && !end.retirada ? end.bairro_id : null;
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (dists ?? []).filter((d) => !t || (d.nome + d.segmento + d.cidade).toLowerCase().includes(t));
  }, [dists, q]);
  const areaOf = (d: Distributor) => (bairroId ? areas.find((a) => a.distributor_id === d.id && a.bairro_id === bairroId) : undefined);
  const entregam = bairroId ? lista.filter((d) => areaOf(d)).sort((a, b) => Number(isOpen(b)) - Number(isOpen(a))) : [];
  const outras = bairroId ? lista.filter((d) => !areaOf(d)) : lista;

  const card = (d: Distributor, modo: 'entrega' | 'retirada' | 'neutro') => {
    const w = wallets.find((x) => x.distributor_id === d.id);
    const a = areaOf(d);
    const ab = isOpen(d);
    return (
      <Link key={d.id} className="dcard" href={`/d/${d.id}`}>
        <Logo nome={d.nome} cor={d.cor} />
        <div>
          <div className="nm">{d.nome}</div>
          <div className="ds">{d.segmento}</div>
          <div className="ds">
            <span className={ab ? 'st-open' : 'st-closed'}>{openText(d)}</span> ·{' '}
            {modo === 'neutro' ? `${d.bairro}, ${d.cidade}` : modo === 'retirada' ? 'só retirada' : a && Number(a.taxa) > 0 ? `entrega ${brl(a.taxa)}` : 'entrega grátis'}
          </div>
        </div>
        <div className="mypts">{w ? (<><b className="num">{num(w.saldo)}</b>pts</>) : (<>Sem pontos<br />ainda</>)}</div>
      </Link>
    );
  };

  return (
    <AppShell showAddress>
      <input className="search" type="search" placeholder="Buscar distribuidora…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar distribuidora" />
      {dists === null ? (
        <Spinner />
      ) : !bairroId ? (
        <>
          <h2 className="h2">Distribuidoras parceiras</h2>
          <div className="list">{outras.length ? outras.map((d) => card(d, end?.retirada ? 'retirada' : 'neutro')) : q.trim() ? <Empty>Nenhuma distribuidora encontrada.</Empty> : <Empty><b>Em breve, as distribuidoras da sua região.</b><br />Estamos fechando as primeiras parcerias. Crie sua conta agora: seu CPF já vira seu cartão fidelidade.</Empty>}</div>
        </>
      ) : (
        <>
          <h2 className="h2">Entregam em {end && !end.retirada ? end.bairro : ''}</h2>
          <div className="list">{entregam.length ? entregam.map((d) => card(d, 'entrega')) : <Empty>Nenhuma distribuidora parceira entrega neste bairro ainda.</Empty>}</div>
          {outras.length > 0 && (
            <>
              <p className="groupt">Não entregam no seu bairro · retirada na loja</p>
              <div className="list">{outras.map((d) => card(d, 'retirada'))}</div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
