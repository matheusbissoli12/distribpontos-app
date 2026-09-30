import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type Session = { user: User | null; profile: Profile | null; loading: boolean; refresh: () => Promise<void> };
const Ctx = createContext<Session>({ user: null, profile: null, loading: true, refresh: async () => {} });

/** Sessão do usuário + perfil (com CPF), compartilhada por todas as telas. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await sb().auth.getSession();
    const u = data.session?.user ?? null;
    setUser(u);
    if (u) {
      const { data: p } = await sb().from('profiles').select('*').eq('id', u.id).maybeSingle();
      setProfile((p as Profile) ?? null);
    } else setProfile(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data } = sb().auth.onAuthStateChange((ev) => {
      if (ev !== 'TOKEN_REFRESHED') setTimeout(load, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  return <Ctx.Provider value={{ user, profile, loading, refresh: load }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
