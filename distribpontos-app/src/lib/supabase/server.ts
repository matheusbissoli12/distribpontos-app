import { cookies, headers } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

/** Cliente com a sessão do usuário (cookies) — para rotas de API. */
export function sbServer(): SupabaseClient {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* chamado de um Server Component: pode ignorar */
        }
      },
    },
  }) as unknown as SupabaseClient;
}

/** Cliente com a service role — ignora RLS. Só no servidor! */
export function sbAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Usuário logado da requisição (ou null). Aceita o cookie do site ou o token "Bearer" enviado pelo app nativo. */
export async function currentUser(): Promise<User | null> {
  const auth = headers().get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const { data } = await sbAdmin().auth.getUser(auth.slice(7));
    return data.user ?? null;
  }
  const { data } = await sbServer().auth.getUser();
  return data.user ?? null;
}

/** Papel do usuário numa distribuidora (dono/caixa/entregador) ou null. */
export async function roleIn(userId: string, distId: string): Promise<string | null> {
  const { data } = await sbAdmin()
    .from('members')
    .select('role')
    .eq('distributor_id', distId)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.role as string) ?? null;
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await sbAdmin().from('profiles').select('is_admin').eq('id', userId).maybeSingle();
  return !!data?.is_admin;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

export function siteUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (req) return new URL(req.url).origin;
  return '';
}
