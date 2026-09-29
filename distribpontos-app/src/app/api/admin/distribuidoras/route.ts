import { currentUser, isPlatformAdmin, json, sbAdmin, siteUrl } from '@/lib/supabase/server';
import { addMember } from '@/lib/team';

export const dynamic = 'force-dynamic';

/** Admin cadastra uma distribuidora (em implantação) e convida o dono. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !(await isPlatformAdmin(user.id))) return json({ error: 'Sem permissão.' }, 403);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const cnpj = (b.cnpj ?? '').replace(/\D/g, '');
  if (!b.nome?.trim() || cnpj.length !== 14 || !b.cidade?.trim() || !b.donoEmail?.includes('@')) return json({ error: 'Preencha nome, CNPJ, cidade e e-mail do dono.' }, 400);
  const admin = sbAdmin();
  const { data: d, error } = await admin.from('distributors').insert({
    nome: b.nome.trim(), cnpj, cidade: b.cidade.trim(), bairro: (b.bairro ?? '').trim(), plano: ['Essencial', 'Pro', 'Rede'].includes(b.plano) ? b.plano : 'Essencial',
  }).select('id').single();
  if (error) return json({ error: error.message.includes('duplicate') ? 'Já existe uma distribuidora com este CNPJ.' : error.message }, 400);
  const r = await addMember(d.id, b.donoEmail, b.donoNome ?? '', 'dono', siteUrl(req));
  if ('error' in r) return json({ error: `Distribuidora criada, mas o convite falhou: ${r.error}` }, 400);
  return json({ ok: true, id: d.id });
}
