import { currentUser, json, sbAdmin } from '@/lib/supabase/server';
import { sendSms, smsConfigured } from '@/lib/sms';
import { celHide, toE164 } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Caixa inicia o lançamento: gera código, envia ao cliente (SMS e/ou app) e devolve só o id. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const b = (await req.json().catch(() => ({}))) as { distId?: string; cpf?: string; valor?: number; cupom?: string; celular?: string };
  if (!b.distId || !b.cpf || !b.valor) return json({ error: 'Dados incompletos.' }, 400);

  const admin = sbAdmin();
  const { data, error } = await admin.rpc('counter_start', {
    p_user: user.id, p_dist: b.distId, p_cpf: b.cpf, p_valor: b.valor, p_cupom: b.cupom ?? null, p_celular: b.celular ?? null,
  });
  if (error) return json({ error: error.message }, 400);
  const row = (Array.isArray(data) ? data[0] : data) as { code_id: string; code: string; pts: number; celular: string; registrado: boolean; nome: string | null };
  const { data: d } = await admin.from('distributors').select('nome').eq('id', b.distId).maybeSingle();

  const dev = process.env.SMS_DEV_MODE === 'true';
  if (smsConfigured()) {
    try {
      await sendSms(toE164(row.celular), `${d?.nome ?? 'DistribPontos'}: seu código para confirmar ${row.pts} pontos é ${row.code}. Informe ao caixa. Não compartilhe com mais ninguém.`);
    } catch (e) {
      if (!row.registrado && !dev) return json({ error: (e as Error).message }, 502);
    }
  } else if (!row.registrado && !dev) {
    return json({ error: 'SMS não configurado. O cliente precisa ter o app para receber o código, ou configure o Twilio.' }, 400);
  }

  return json({
    codeId: row.code_id,
    pts: row.pts,
    nome: row.nome,
    registrado: row.registrado,
    celular: celHide(row.celular),
    ...(dev ? { devCode: row.code } : {}),
  });
}
