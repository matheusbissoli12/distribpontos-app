/** Integração Pix do Mercado Pago (API de pagamentos v1). Cada distribuidora usa o próprio Access Token. */
const API = 'https://api.mercadopago.com';

export type MpPayment = {
  id: number;
  status: string; // pending | approved | rejected | cancelled | refunded ...
  transaction_amount: number;
  external_reference: string | null;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};

function isoWithOffset(d: Date) {
  // Mercado Pago espera data com fuso, ex.: 2026-09-25T22:30:00.000-03:00
  const local = new Date(d.getTime() - 3 * 3600 * 1000);
  return local.toISOString().replace('Z', '-03:00');
}

export async function createPixPayment(token: string, p: {
  orderId: number; amount: number; description: string; payerEmail: string; payerFirstName: string; payerCpf: string; notificationUrl: string;
}): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `dp-order-${p.orderId}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(p.amount.toFixed(2)),
      description: p.description.slice(0, 250),
      payment_method_id: 'pix',
      external_reference: String(p.orderId),
      notification_url: p.notificationUrl,
      date_of_expiration: isoWithOffset(new Date(Date.now() + 30 * 60 * 1000)),
      payer: {
        email: p.payerEmail,
        first_name: p.payerFirstName,
        identification: { type: 'CPF', number: p.payerCpf },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago recusou a cobrança: ${data?.message ?? res.status}`);
  return data as MpPayment;
}

export async function getPayment(token: string, id: string): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Pagamento não encontrado (${res.status})`);
  return (await res.json()) as MpPayment;
}

export async function checkToken(token: string): Promise<{ id: number; nickname?: string; email?: string }> {
  const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error('Access Token do Mercado Pago inválido.');
  return res.json();
}
