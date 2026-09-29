'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { Logo, Spinner } from '@/components/ui';

type M = { role: string; distributors: { id: string; nome: string; cor: string; status: string } | null };

export default function PainelHome() {
  const router = useRouter();
  const [lista, setLista] = useState<M[] | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb().auth.getUser();
      if (!u.user) return router.replace('/painel/login');
      const [{ data }, { data: p }] = await Promise.all([
        sb().from('members').select('role, distributors(id, nome, cor, status)').eq('user_id', u.user.id),
        sb().from('profiles').select('is_admin').eq('id', u.user.id).maybeSingle(),
      ]);
      const l = ((data as unknown as M[]) ?? []).filter((m) => m.distributors);
      setAdmin(!!p?.is_admin);
      if (l.length === 1 && !p?.is_admin) return router.replace(`/painel/${l[0].distributors!.id}`);
      setLista(l);
    })();
  }, [router]);

  if (!lista) return <Spinner />;
  return (
    <div className="pwrap" style={{ maxWidth: 560 }}>
      <div className="ptop"><h1>Distrib<b>Pontos</b></h1><button className="abtn ghost" onClick={async () => { await sb().auth.signOut(); router.replace('/painel/login'); }}>Sair</button></div>
      {admin && <Link className="btn" href="/admin" style={{ textAlign: 'center' }}>Admin da plataforma</Link>}
      {lista.length === 0 && <div className="note">Seu usuário ainda não está ligado a nenhuma distribuidora. Peça ao dono da loja para convidar você.</div>}
      {lista.map((m) => (
        <Link key={m.distributors!.id} className="dcard" href={`/painel/${m.distributors!.id}`}>
          <Logo nome={m.distributors!.nome} cor={m.distributors!.cor} />
          <div><div className="nm">{m.distributors!.nome}</div><div className="ds">Você é {m.role} · {m.distributors!.status === 'ativa' ? 'no ar' : m.distributors!.status === 'implantacao' ? 'em implantação' : 'suspensa'}</div></div>
          <span className="sub">Abrir ›</span>
        </Link>
      ))}
    </div>
  );
}
