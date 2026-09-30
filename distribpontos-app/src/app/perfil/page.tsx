'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, useToast } from '@/components/ui';
import { useSession } from '@/components/useSession';
import { sb } from '@/lib/supabase/client';
import { clearCart, setEndereco } from '@/lib/cart';
import { errMsg, maskCel, maskCpf } from '@/lib/format';

export default function Perfil() {
  const router = useRouter();
  const toast = useToast();
  const { profile, refresh } = useSession();
  const [del, setDel] = useState(false);

  async function toggleMkt() {
    if (!profile) return;
    const { error } = await sb().from('profiles').update({ mkt_optin: !profile.mkt_optin }).eq('id', profile.id);
    if (error) toast(errMsg(error)); else refresh();
  }
  async function pedir(tipo: 'copia' | 'exclusao') {
    const { error } = await sb().rpc('request_lgpd', { p_tipo: tipo });
    if (error) return toast(errMsg(error));
    toast(tipo === 'copia' ? 'Pedido registrado. Você recebe a cópia em até 15 dias.' : 'Pedido de exclusão registrado. Concluímos em até 15 dias e avisamos você.');
    setDel(false);
  }
  async function sair() {
    await sb().auth.signOut();
    clearCart();
    setEndereco(null);
    router.replace('/');
  }

  return (
    <AppShell requireLogin>
      {!profile ? <Spinner /> : (
        <>
          <div className="cpfcard"><small>Cartão fidelidade · informe no caixa</small><span className="n">{maskCpf(profile.cpf ?? '')}</span><small>{profile.nome}</small></div>
          <div className="card">
            <h2 className="h2">Meus dados</h2>
            <div className="kv"><span>Nome</span><b>{profile.nome}</b></div>
            <div className="kv"><span>CPF</span><b className="mono">{maskCpf(profile.cpf ?? '')}</b></div>
            <div className="kv"><span>Celular</span><b>{maskCel(profile.celular ?? '')}</b></div>
            {profile.email && <div className="kv"><span>E-mail</span><b>{profile.email}</b></div>}
            <div className="kv"><span>Ofertas e avisos</span><button className={`sw ${profile.mkt_optin ? 'on' : ''}`} onClick={toggleMkt}><i />{profile.mkt_optin ? 'Sim' : 'Não'}</button></div>
          </div>
          <div className="card">
            <h2 className="h2">Privacidade (LGPD)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <Link className="btn ghost" style={{ textAlign: 'center' }} href="/termos">Termos de uso e política de privacidade</Link>
              <button className="btn ghost" onClick={() => pedir('copia')}>Pedir cópia dos meus dados</button>
              {del ? (
                <div className="err">Excluir sua conta apaga seus dados e todos os seus pontos. Não dá para desfazer.
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="sbtn" style={{ background: 'var(--surface)', color: 'var(--ink)' }} onClick={() => setDel(false)}>Manter conta</button>
                    <button className="sbtn" style={{ background: 'var(--bad)' }} onClick={() => pedir('exclusao')}>Pedir exclusão</button>
                  </div>
                </div>
              ) : <button className="btn ghost danger" onClick={() => setDel(true)}>Excluir minha conta</button>}
            </div>
          </div>
          <button className="btn ghost" onClick={sair}>Sair da conta</button>
        </>
      )}
    </AppShell>
  );
}
