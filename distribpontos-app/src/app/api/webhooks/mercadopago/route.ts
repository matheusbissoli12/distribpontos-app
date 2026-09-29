import { json, sbAdmin } from '@/lib/supabase/server';
import { getPayment } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

/**
 * Notificação do Mercado Pago. Não confiamos no conteúdo recebido:
 * buscamos o pagamento na API com o token da própria distribuidora.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const distId = url.searchParams.get('d');
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const id = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if (!distId || !id || (type && type !== 'payment')) return json({ ignored: true });

  const admin = sbAdmin();
  const { data: sec } = await admin.from('distributor_secrets').select('mp_access_token').eq('distributor_id', distId).maybeSingle();
  if (!sec?.mp_access_token) return json({ ignored: true });
  try {
    const pay = await getPayment(sec.mp_access_token, id);
    if (pay.status !== 'approved' || !pay.external_reference) return json({ ok: true, status: pay.status });
    const { data: o } = await admin.from('orders').select('id, distributor_id').eq('id', Number(pay.external_reference)).maybeSingle();
    if (!o || o.distributor_id !== distId) return json({ ignored: true });
    await admin.rpc('mark_order_paid', { p_order: o.id, p_payment_id: String(pay.id), p_amount: pay.transaction_amount });
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

export async function GET() {
  return json({ ok: true });
}
