import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/** Mantém a sessão do Supabase renovada nos cookies. */
export async function middleware(request: NextRequest) {
  // Site da equipe em endereço próprio: painel.seudominio e admin.seudominio abrem direto o painel/admin.
  const host = request.headers.get('host') ?? '';
  if (request.nextUrl.pathname === '/') {
    if (host.startsWith('painel.')) return NextResponse.redirect(new URL('/painel', request.url));
    if (host.startsWith('admin.')) return NextResponse.redirect(new URL('/admin', request.url));
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon-.*\\.png|api/webhooks).*)'],
};
