/** Envio de SMS pelo Twilio (usado no código do balcão). */
export function smsConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function sendSms(toE164: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164, From: process.env.TWILIO_FROM!, Body: body }).toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Falha ao enviar SMS (${res.status}): ${t.slice(0, 200)}`);
  }
}
