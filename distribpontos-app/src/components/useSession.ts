'use client';
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

/** Sessão do usuário + perfil (com CPF). */
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await sb().auth.getUser();
    setUser(data.user ?? null);
    if (data.user) {
      const { data: p } = await sb().from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      setProfile((p as Profile) ?? null);
    } else setProfile(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data } = sb().auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  return { user, profile, loading, refresh: load };
}
