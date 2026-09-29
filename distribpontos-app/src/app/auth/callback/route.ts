import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/supabase/server';

/** Troca o código do link de e-mail (recuperação de senha) por uma sessão. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/painel';
  if (code) await sbServer().auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/painel', url.origin));
}
