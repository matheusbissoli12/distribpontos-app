'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { sb } from '@/lib/supabase/client';
import { useEndereco } from '@/lib/cart';
import { num } from '@/lib/format';
import { Icon } from './ui';
import { AddressSheet } from './AddressSheet';
import { useSession } from './useSession';

type Head = { title: string; subtitle?: string; color?: string; back?: string; right?: ReactNode };

/** Casca do app do cliente: topo, endereço e menu inferior. */
export function AppShell({ children, head, showAddress, requireLogin }: { children: ReactNode; head?: Head; showAddress?: boolean; requireLogin?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useSession();
  const end = useEndereco();
  const [sheet, setSheet] = useState(false);
  const [pts, setPts] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (requireLogin && !user) router.replace(`/entrar?next=${encodeURIComponent(path)}`);
    else if (user && !profile?.cpf && path !== '/cadastro') router.replace(`/cadastro?next=${encodeURIComponent(path)}`);
  }, [loading, user, profile, requireLogin, path, router]);

  useEffect(() => {
    if (!profile?.cpf) return;
    sb().rpc('my_wallets').then(({ data }) => setPts(((data as { saldo: number }[]) ?? []).reduce((a, w) => a + w.saldo, 0)));
    sb().from('notifications').select('id', { count: 'exact', head: true }).eq('lida', false).then(({ count }) => setUnread(count ?? 0));
  }, [profile?.cpf, path]);

  const color = head?.color;
  const nav = [
    ['/', 'Início', 'home'],
    ['/pedidos', 'Pedidos', 'list'],
    ['/pontos', 'Pontos', 'coin'],
    ['/perfil', 'Perfil', 'user'],
  ];
  const navOn = path === '/' || path.startsWith('/d/') || path === '/carrinho' ? '/' : '/' + (path.split('/')[1] ?? '');

  return (
    <div className="shell">
      <header className="ahead" style={color ? { background: color, color: '#fff' } : { background: 'var(--primary)', color: 'var(--primary-ink)' }}>
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {head?.back && (
              <Link className="back" href={head.back} aria-label="Voltar">‹</Link>
            )}
            <div className="logo" style={{ minWidth: 0 }}>
              {head?.title ?? 'DistribPontos'}
              <small>{head?.subtitle ?? (profile?.nome ? `Olá, ${profile.nome.split(' ')[0]}` : 'Peça e ganhe pontos')}</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {head?.right}
            {!head?.right && user && profile?.cpf && (
              <>
                <Link className="ptspill num" href="/pontos">{pts === null ? '…' : num(pts)} pts</Link>
                <Link className="hdbtn" href="/avisos" aria-label="Avisos">
                  <Icon name="bell" size={20} />
                  {unread > 0 && <span className="dot">{unread}</span>}
                </Link>
              </>
            )}
            {!head?.right && !loading && !user && (
              <Link className="ptspill" href={`/entrar?next=${encodeURIComponent(path)}`}>Entrar</Link>
            )}
          </div>
        </div>
        {showAddress && (
          <div className="addr">
            <span>
              {!end ? 'Informe o endereço de entrega' : end.retirada ? 'Vou retirar na loja' : (
                <>Entregar em <b>{end.rua}{end.comp ? `, ${end.comp}` : ''}, {end.bairro}</b></>
              )}
            </span>
            <button className="ptspill" style={{ padding: '3px 9px', fontSize: 12, flex: 'none' }} onClick={() => setSheet(true)}>
              {end ? 'Alterar' : 'Definir'}
            </button>
          </div>
        )}
      </header>
      <main className="scr">{children}</main>
      <nav className="nav">
        {nav.map(([href, label, icon]) => (
          <Link key={href} href={href} className={navOn === href ? 'on' : ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 11, color: navOn === href ? 'var(--primary)' : 'var(--muted)', padding: '4px 0', fontWeight: navOn === href ? 600 : 400 }}>
            <Icon name={icon} />
            {label}
          </Link>
        ))}
      </nav>
      {sheet && <AddressSheet onClose={() => setSheet(false)} />}
    </div>
  );
}

export function useAddressSheet() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), node: open ? <AddressSheet onClose={() => setOpen(false)} /> : null };
}
