'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase/client';
import { errMsg } from '@/lib/format';

/** Criar/trocar senha. Recebe o link do convite (tokens no #hash) ou da recuperação (sessão já criada). */
export default function Senha() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const h = new URLSearchParams(location.hash.replace(/^#/, ''));
      const at = h.get('access_token'), rt = h.get('refresh_token');
      if (at && rt) {
        await sb().auth.setSession({ access_token: at, refresh_token: rt });
        history.replaceState(null, '', location.pathname);
      }
      const { data } = await sb().auth.getUser();
      if (!data.user) setErr('Link inválido ou expirado. Peça um novo convite ou use “Esqueci minha senha”.');
      setEmail(data.user?.email ?? '');
      setReady(true);
    })();
  }, []);

  async function salvar() {
    setErr('');
    if (s1.length < 8) return setErr('Use pelo menos 8 caracteres.');
    if (s1 !== s2) return setErr('As senhas não conferem.');
    const { error } = await sb().auth.updateUser({ password: s1 });
    if (error) return setErr(errMsg(error));
    router.replace('/painel');
  }

  return (
    <div className="auth-card">
      <div className="ptop"><h1>Distrib<b>Pontos</b></h1><span className="sub">Criar senha</span></div>
      {!ready ? <div className="spin" /> : (
        <>
          {email && <p className="sub" style={{ margin: 0 }}>Conta: <b>{email}</b></p>}
          <label className="lbl">Nova senha<input className="inp" type="password" autoComplete="new-password" value={s1} onChange={(e) => setS1(e.target.value)} /></label>
          <label className="lbl">Repita a senha<input className="inp" type="password" autoComplete="new-password" value={s2} onChange={(e) => setS2(e.target.value)} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn" onClick={salvar} disabled={!email}>Salvar senha</button>
        </>
      )}
    </div>
  );
}
