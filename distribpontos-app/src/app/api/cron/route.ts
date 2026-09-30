import { json, sbAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Tarefas diárias (Vercel Cron). Protegido por CRON_SECRET. */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return json({ error: 'Não autorizado.' }, 401);
  const admin = sbAdmin();
  const [pix, venc] = await Promise.all([admin.rpc('cancel_stale_pix'), admin.rpc('expire_points')]);
  return json({ pixCancelados: pix.data ?? null, pontosVencidos: venc.data ?? null, erros: [pix.error?.message, venc.error?.message].filter(Boolean) });
}
