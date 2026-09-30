'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { sb } from '@/lib/supabase/client';
import { Logo, Spinner } from '@/components/ui';
import { openText, isOpen } from '@/lib/store';
import type { Distributor, Member } from '@/lib/types';
import { PanelCtx, type PanelState } from './PanelContext';

const TABS: [string, string, string[]][] = [
  ['', 'Pedidos', ['dono', 'caixa', 'entregador']],
  ['/balcao', 'Balcão', ['dono', 'caixa']],
  ['/catalogo', 'Catálogo', ['dono']],
  ['/premios', 'Pontos e prêmios', ['dono']],
  ['/clientes', 'Clientes', ['dono', 'caixa']],
  ['/config', 'Configurações', ['dono']],
];

export default function PanelLayout({ children, params }: { children: ReactNode; params: { id: string } }) {
  const router = useRouter();
  const path = usePathname();
  const [st, setSt] = useState<Omit<PanelState, 'reload'> | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data: u } = await sb().auth.getUser();
    if (!u.user) { router.replace('/painel/login'); return; }
    const [{ data: d }, { data: ms }] = await Promise.all([
      sb().from('distributors').select('*').eq('id', params.id).maybeSingle(),
      sb().from('members').select('*').eq('distributor_id', params.id),
    ]);
    const me = ((ms as Member[]) ?? []).find((m) => m.user_id === u.user!.id);
    if (!d || !me) { setErr('Você não tem acesso a esta distribuidora.'); return; }
    setSt({ d: d as Distributor, role: me.role, userId: u.user.id, members: (ms as Member[]) ?? [] });
  }, [params.id, router]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="pwrap"><div className="err">{err}</div><Link className="abtn ghost" href="/painel">Voltar</Link></div>;
  if (!st) return <Spinner />;
  const base = `/painel/${params.id}`;
  const tabs = TABS.filter((t) => t[2].includes(st.role));
  const me = st.members.find((m) => m.user_id === st.userId);

  return (
    <PanelCtx.Provider value={{ ...st, reload: load }}>
      <div className="pwrap">
        <div className="panel">
          <div className="phead">
            <div className="who-sel">
              <Logo nome={st.d.nome} cor={st.d.cor} />
              <div><h2 style={{ fontSize: 20 }}>{st.d.nome}</h2><p>{me?.nome || me?.email} · {st.role}</p></div>
            </div>
            <div className="right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div>
                <span className={`pill ${st.d.status === 'ativa' ? 'st-entregue' : st.d.status === 'implantacao' ? 'st-separando' : 'st-cancelado'}`}>{st.d.status === 'ativa' ? 'No ar' : st.d.status === 'implantacao' ? 'Em implantação' : 'Suspensa'}</span>{' '}
                <span className={isOpen(st.d) ? 'st-open' : 'st-closed'} style={{ fontSize: 12.5 }}>{openText(st.d)}</span>
              </div>
              <div className="row-actions">
                <Link className="abtn ghost" href="/painel">Trocar loja</Link>
                <button className="abtn ghost" onClick={async () => { await sb().auth.signOut(); router.replace('/painel/login'); }}>Sair</button>
              </div>
            </div>
          </div>
          <div className="ptabs">
            {tabs.map(([href, label]) => (
              <Link key={href} href={base + href} className={path === base + href ? 'on' : ''} style={{ padding: '11px 12px', fontSize: 13.5, whiteSpace: 'nowrap', borderBottom: `2px solid ${path === base + href ? 'var(--accent)' : 'transparent'}`, color: path === base + href ? 'var(--ink)' : 'var(--muted)', fontWeight: path === base + href ? 600 : 500 }}>
                {st.role === 'entregador' && href === '' ? 'Minhas entregas' : label}
              </Link>
            ))}
          </div>
          <div className="pbody">{children}</div>
        </div>
      </div>
    </PanelCtx.Provider>
  );
}
