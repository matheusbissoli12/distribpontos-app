import './storage';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { API_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config';

const url = SUPABASE_URL;
const key = SUPABASE_ANON_KEY;

/** true quando src/config.ts (ou o .env) ainda não foi preenchido. */
export const supabaseMissing = !url || !key;

let client: SupabaseClient | null = null;

/** Cliente do Supabase (sessão salva no aparelho). */
export function sb(): SupabaseClient {
  if (!client) {
    client = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
      auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
    if (Platform.OS !== 'web') {
      AppState.addEventListener('change', (s) => {
        if (s === 'active') client!.auth.startAutoRefresh();
        else client!.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}

const API = API_URL;

/** Chama uma rota do backend (Next.js na Vercel) enviando o login do usuário. */
export async function api<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}): Promise<{ ok: boolean; data: T & { error?: string } }> {
  if (!API) return { ok: false, data: { error: 'Servidor não configurado: preencha apiUrl em src/config.ts.' } as T & { error?: string } };
  const { data } = await sb().auth.getSession();
  const qs = init.query ? '?' + new URLSearchParams(Object.entries(init.query).map(([k, v]) => [k, String(v)])).toString() : '';
  try {
    const r = await fetch(`${API}${path}${qs}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        'content-type': 'application/json',
        ...(data.session ? { authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, data: j };
  } catch {
    return { ok: false, data: { error: 'Sem conexão com o servidor.' } as T & { error?: string } };
  }
}

export const apiUrl = API;
