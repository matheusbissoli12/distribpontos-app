'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { errMsg } from '@/lib/format';

export default function PainelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function entrar() {
    setErr(''); setBusy(true);
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: senha });
    setBusy(false);
    if (error) return setErr('E-mail ou senha incorretos.');
    router.replace('/painel');
  }
  async function esqueci() {
    setErr('');
    if (!email.includes('@')) return setErr('Digite seu e-mail acima.');
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/painel/senha` });
    if (error) return setErr(errMsg(error));
    setMsg('Enviamos um link para criar uma nova senha.');
  }

  return (
    <div className="auth-card">
      <div className="ptop"><h1>Distrib<b>Pontos</b></h1><span className="sub">Painel da distribuidora</span></div>
      <label className="lbl">E-mail<input className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="lbl">Senha<input className="inp" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrar()} /></label>
      {err && <div className="err">{err}</div>}
      {msg && <div className="gain">{msg}</div>}
      <button className="btn" disabled={busy} onClick={entrar}>{busy ? 'Entrando…' : 'Entrar'}</button>
      <button className="sub" style={{ textDecoration: 'underline' }} onClick={esqueci}>Esqueci minha senha</button>
    </div>
  );
}
