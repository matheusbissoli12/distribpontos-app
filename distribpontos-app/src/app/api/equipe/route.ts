import { currentUser, json, roleIn, siteUrl } from '@/lib/supabase/server';
import { addMember } from '@/lib/team';

export const dynamic = 'force-dynamic';

/** Dono convida alguém para a equipe (caixa, entregador ou outro dono). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: 'Faça login.' }, 401);
  const b = (await req.json().catch(() => ({}))) as { distId?: string; email?: string; nome?: string; role?: string };
  if (!b.distId || !b.email?.includes('@') || !['dono', 'caixa', 'entregador'].includes(b.role ?? '')) return json({ error: 'Dados inválidos.' }, 400);
  if ((await roleIn(user.id, b.distId)) !== 'dono') return json({ error: 'Só o dono pode convidar.' }, 403);
  const r = await addMember(b.distId, b.email, b.nome ?? '', b.role as string, siteUrl(req));
  return 'error' in r ? json({ error: r.error }, 400) : json(r);
}
