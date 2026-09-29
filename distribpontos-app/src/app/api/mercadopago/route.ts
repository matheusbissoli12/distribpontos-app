import { currentUser, json, roleIn, sbAdmin } from '@/lib/supabase/server';
import { checkToken } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

/** Dono conecta a conta Mercado Pago da loja (Access Token guardado só no servidor). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const b = (await req.json().catch(() => ({}))) as { distId?: string; token?: string };
  if (!b.distId || !b.token) return json({ error: 'Informe o Access Token.' }, 400);
  if ((await roleIn(user.id, b.distId)) !== 'dono') return json({ error: 'Só o dono pode conectar o Pix.' }, 403);
  try {
    const me = await checkToken(b.token.trim());
    const admin = sbAdmin();
    const { error } = await admin.from('distributor_secrets').upsert({ distributor_id: b.distId, mp_access_token: b.token.trim(), updated_at: new Date().toISOString() });
    if (error) return json({ error: error.message }, 500);
    await admin.from('distributors').update({ pix_ativo: true }).eq('id', b.distId);
    return json({ ok: true, conta: me.nickname ?? me.email ?? String(me.id) });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const b = (await req.json().catch(() => ({}))) as { distId?: string };
  if (!b.distId || (await roleIn(user.id, b.distId)) !== 'dono') return json({ error: 'Sem permissão.' }, 403);
  const admin = sbAdmin();
  await admin.from('distributor_secrets').delete().eq('distributor_id', b.distId);
  await admin.from('distributors').update({ pix_ativo: false }).eq('id', b.distId);
  return json({ ok: true });
}
