import { sbAdmin } from '@/lib/supabase/server';

/** Liga um usuário (existente ou convidado por e-mail) à equipe de uma distribuidora. */
export async function addMember(distId: string, email: string, nome: string, role: string, site: string) {
  const admin = sbAdmin();
  const mail = email.trim().toLowerCase();
  let convidado = false;
  let { data: uid } = await admin.rpc('user_id_by_email', { p_email: mail });
  if (!uid) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(mail, { redirectTo: `${site}/painel/senha`, data: { nome } });
    if (error) return { error: `Não foi possível enviar o convite: ${error.message}` };
    uid = data.user?.id;
    convidado = true;
  }
  const { error } = await admin.from('members').upsert({ distributor_id: distId, user_id: uid, role, nome: nome.trim(), email: mail });
  if (error) return { error: error.message };
  return { ok: true, convidado };
}
