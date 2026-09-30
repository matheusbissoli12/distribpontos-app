'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { sb } from '@/lib/supabase/client';
import { cpfValid, errMsg, maskCpf, onlyDigits } from '@/lib/format';
import { useSession } from '@/components/useSession';
import { Spinner } from '@/components/ui';

function Cadastro() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const { user, profile, loading } = useSession();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [mkt, setMkt] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/entrar');
    else if (profile?.cpf) router.replace(next);
  }, [loading, user, profile, next, router]);

  async function salvar() {
    setErr('');
    if (nome.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome.');
    if (!cpfValid(cpf)) return setErr('CPF inválido. Confira os 11 números.');
    if (!ok) return setErr('Para participar é preciso aceitar os termos e o uso dos dados.');
    setBusy(true);
    const { error } = await sb().rpc('complete_profile', { p_nome: nome, p_cpf: onlyDigits(cpf), p_email: email, p_mkt: mkt, p_consent: ok });
    setBusy(false);
    if (error) return setErr(errMsg(error));
    router.replace(next);
  }

  if (loading || !user) return <Spinner />;
  return (
    <div className="shell">
      <header className="ahead" style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}>
        <div className="logo">DistribPontos<small>Complete seu cadastro</small></div>
      </header>
      <main className="scr">
        <div className="auth">
          <h2>Seu CPF é seu cartão fidelidade</h2>
          <p className="sub" style={{ margin: 0 }}>Peça pelo app ou informe o CPF no caixa das distribuidoras parceiras. Se você já ganhou pontos numa loja, eles aparecem aqui.</p>
          <label className="lbl">Nome completo<input className="inp" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          <label className="lbl">CPF<input className="inp big" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} /></label>
          <label className="lbl">E-mail (opcional, para comprovantes)<input className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Li e aceito os <Link href="/termos" style={{ textDecoration: 'underline' }}>termos de uso</Link> e autorizo o uso do meu CPF e do histórico de compras para o programa de pontos (LGPD).</label>
          <label className="chk"><input type="checkbox" checked={mkt} onChange={(e) => setMkt(e.target.checked)} />Quero receber ofertas e avisos de pontos.</label>
          {err && <div className="err">{err}</div>}
          <button className="btn acc" disabled={busy} onClick={salvar}>{busy ? 'Salvando…' : 'Concluir cadastro'}</button>
        </div>
      </main>
    </div>
  );
}
export default function Page() {
  return <Suspense><Cadastro /></Suspense>;
}
