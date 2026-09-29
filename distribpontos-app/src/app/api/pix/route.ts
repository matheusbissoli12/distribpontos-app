import { currentUser, json, sbAdmin, siteUrl } from '@/lib/supabase/server';
import { createPixPayment, getPayment } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

async function loadOrder(orderId: number, userId: string) {
  const admin = sbAdmin();
  const { data: o } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!o || o.customer_id !== userId) return { error: 'Pedido não encontrado.' as const };
  const { data: sec } = await admin.from('distributor_secrets').select('mp_access_token').eq('distributor_id', o.distributor_id).maybeSingle();
  return { o, token: (sec?.mp_access_token as string | undefined) ?? null };
}

/** Gera o Pix de um pedido (idempotente). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: number };
  if (!orderId) return json({ error: 'Pedido inválido.' }, 400);
  const r = await loadOrder(Number(orderId), user.id);
  if ('error' in r) return json({ error: r.error }, 404);
  const { o, token } = r;
  if (o.status !== 'aguardando_pagamento') return json({ ok: true, status: o.status });
  if (o.pix_qr) return json({ ok: true });
  if (!token) return json({ error: 'Esta loja ainda não configurou o Pix.' }, 400);

  const admin = sbAdmin();
  const { data: prof } = await admin.from('profiles').select('nome, email').eq('id', user.id).maybeSingle();
  const { data: d } = await admin.from('distributors').select('nome').eq('id', o.distributor_id).maybeSingle();
  try {
    const pay = await createPixPayment(token, {
      orderId: o.id,
      amount: Number(o.total),
      description: `Pedido #${o.id} - ${d?.nome ?? 'DistribPontos'}`,
      payerEmail: prof?.email || `cliente${o.id}@distribpontos.app`,
      payerFirstName: (prof?.nome ?? 'Cliente').split(' ')[0],
      payerCpf: o.cpf,
      notificationUrl: `${siteUrl(req)}/api/webhooks/mercadopago?d=${o.distributor_id}`,
    });
    const td = pay.point_of_interaction?.transaction_data;
    await admin.rpc('set_order_pix', { p_order: o.id, p_payment_id: String(pay.id), p_qr: td?.qr_code ?? null, p_qr64: td?.qr_code_base64 ?? null });
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
}

/** Confere o pagamento (fallback caso o webhook atrase). */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const orderId = Number(new URL(req.url).searchParams.get('orderId'));
  const r = await loadOrder(orderId, user.id);
  if ('error' in r) return json({ error: r.error }, 404);
  const { o, token } = r;
  if (o.status !== 'aguardando_pagamento' || !o.mp_payment_id || !token) return json({ status: o.status });
  try {
    const pay = await getPayment(token, o.mp_payment_id);
    if (pay.status === 'approved' && String(pay.external_reference) === String(o.id)) {
      await sbAdmin().rpc('mark_order_paid', { p_order: o.id, p_payment_id: String(pay.id), p_amount: pay.transaction_amount });
      return json({ status: 'novo' });
    }
    return json({ status: o.status, mp: pay.status });
  } catch {
    return json({ status: o.status });
  }
}
