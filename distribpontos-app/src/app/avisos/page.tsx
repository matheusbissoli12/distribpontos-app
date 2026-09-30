'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, Empty } from '@/components/ui';
import { sb } from '@/lib/supabase/client';
import { dataHora } from '@/lib/format';

type N = { id: number; titulo: string; mensagem: string; lida: boolean; created_at: string };

export default function Avisos() {
  const [l, setL] = useState<N[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await sb().from('notifications').select('*').order('created_at', { ascending: false }).limit(60);
      setL((data as N[]) ?? []);
      const ids = ((data as N[]) ?? []).filter((x) => !x.lida).map((x) => x.id);
      if (ids.length) await sb().from('notifications').update({ lida: true }).in('id', ids);
    })();
  }, []);
  return (
    <AppShell requireLogin head={{ title: 'Avisos', back: '/' }}>
      {l === null ? <Spinner /> : l.length === 0 ? <Empty>Nenhum aviso ainda.</Empty> : l.map((n) => (
        <div key={n.id} className={`notif ${n.lida ? '' : 'new'}`}>
          <div className="ch ap">APP</div>
          <div><b>{n.titulo}</b><br />{n.mensagem}<div className="sub">{dataHora(n.created_at)}</div></div>
        </div>
      ))}
    </AppShell>
  );
}
