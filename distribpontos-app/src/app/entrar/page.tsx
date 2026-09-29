'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { sb } from '@/lib/supabase/client';
import { errMsg, maskCel, onlyDigits, toE164 } from '@/lib/format';

function Entrar() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [cel, setCel] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'cel' | 'code'>('cel');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar() {
    setErr('');
    if (onlyDigits(cel).length < 10) return setErr('Informe o celular com DDD.');
    setBusy(true);
    const { error } = await sb().auth.signInWithOtp({ phone: toE164(cel) });
    setBusy(false);
    if (error) return setErr(errMsg(error));
    setStep('code');
  }
  async function verificar() {
    setErr('');
    setBusy(true);
    const { data, error } = await sb().auth.verifyOtp({ phone: toE164(cel), token: code.trim(), type: 'sms' });
    if (error || !data.user) {
      setBusy(false);
      return setErr('Código incorreto ou expirado.');
    }
    const { data: p } = await sb().from('profiles').select('cpf').eq('id', data.user.id).maybeSingle();
    router.replace(p?.cpf ? next : `/cadastro?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="shell">
      <header className="ahead" style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}>
        <div className="logo">DistribPontos<small>Peça e ganhe pontos nas distribuidoras da sua região</small></div>
      </header>
      <main className="scr">
        <div className="auth">
          <h2>{step === 'cel' ? 'Entre com seu celular' : 'Digite o código'}</h2>
          {step === 'cel' ? (
            <>
              <p className="sub" style={{ margin: 0 }}>Enviamos um código por SMS. Na primeira vez, você completa o cadastro com seu CPF, que vira seu cartão fidelidade.</p>
              <label className="lbl">Celular com DDD
                <input className="inp big" inputMode="tel" autoComplete="tel" placeholder="(27) 99999-9999" value={cel} onChange={(e) => setCel(maskCel(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && enviar()} />
              </label>
              {err && <div className="err">{err}</div>}
              <button className="btn" disabled={busy} onClick={enviar}>{busy ? 'Enviando…' : 'Receber código por SMS'}</button>
            </>
          ) : (
            <>
              <p className="sub" style={{ margin: 0 }}>Enviamos um SMS para {cel}.</p>
              <label className="lbl">Código
                <input className="inp big" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(onlyDigits(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && verificar()} />
              </label>
              {err && <div className="err">{err}</div>}
              <button className="btn" disabled={busy || code.length < 4} onClick={verificar}>{busy ? 'Entrando…' : 'Entrar'}</button>
              <button className="btn ghost" onClick={() => { setStep('cel'); setCode(''); }}>Trocar número</button>
            </>
          )}
          <Link className="sub" style={{ textDecoration: 'underline' }} href="/termos">Termos de uso e política de privacidade</Link>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <Suspense><Entrar /></Suspense>;
}
