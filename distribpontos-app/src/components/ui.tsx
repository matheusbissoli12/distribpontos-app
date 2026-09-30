'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { STATUS } from '@/lib/format';

/* ---------- Toast ---------- */
const ToastCtx = createContext<(m: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status" aria-live="polite">
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export const Spinner = () => (
  <div className="center">
    <div className="spin" aria-label="Carregando" />
  </div>
);

/* ---------- Ícones ---------- */
const G: Record<string, string> = {
  can: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M7 7.5h10M7 16.5h10"/>',
  bottle: '<path d="M10 2.5h4v4l2 3V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V9.5l2-3z"/><path d="M8 13h8"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-4 0-6z"/>',
  bolt: '<path d="M13 2.5 5 14h6l-1 7.5 8-11.5h-6z"/>',
  box: '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z"/>',
  tool: '<path d="M14.5 4a4 4 0 0 0-4.8 5.2L4 15l2.5 2.5 5.8-5.7A4 4 0 0 0 17.5 7l-2.3 2.3-2-2z"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  home: '<path d="M3.5 10.5 12 4l8.5 6.5V20h-5.5v-5.5h-6V20H3.5z"/>',
  list: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.5a1.75 1.75 0 0 1 0 3.5h-2a1.75 1.75 0 0 0 0 3.5H14.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8"/>',
};
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round"
      aria-hidden="true" dangerouslySetInnerHTML={{ __html: G[name] ?? G.box }} />
  );
}
const CAT: Record<string, [string, string]> = {
  Cervejas: ['can', '#C4870F'], Refrigerantes: ['bottle', '#C23B2E'], 'Águas': ['drop', '#2A7DB5'], 'Energéticos': ['bolt', '#6E8F1E'],
  'Gás': ['flame', '#8A5A44'], 'Conveniência': ['box', '#1F8F9C'], 'Acessórios': ['tool', '#5B6B7A'], Outros: ['box', '#7A6A5B'],
};
export function Tile({ categoria, size = 52, gift }: { categoria: string; size?: number; gift?: boolean }) {
  const [g, h] = CAT[categoria] ?? CAT.Outros;
  return (
    <div className="tile" style={{ '--h': h, width: size, height: size } as React.CSSProperties}>
      <Icon name={gift ? 'gift' : g} size={size / 2} />
    </div>
  );
}

export function TierPill({ nivel }: { nivel: string }) {
  const cls = nivel === 'Ouro' ? 'gold' : nivel === 'Prata' ? 'silver' : 'bronze';
  return (
    <span className={`tier ${cls}`}>
      <i />
      {nivel}
    </span>
  );
}

const STC: Record<string, string> = { aguardando_pagamento: 'novo', novo: 'novo', separando: 'separando', em_rota: 'em_rota', entregue: 'entregue', cancelado: 'cancelado' };
export function StatusPill({ status }: { status: string }) {
  return <span className={`pill st-${STC[status] ?? status}`}>{STATUS[status] ?? status}</span>;
}

export function Track({ status, retirada }: { status: string; retirada?: boolean }) {
  const flow = retirada ? ['novo', 'separando', 'entregue'] : ['novo', 'separando', 'em_rota', 'entregue'];
  const i = flow.indexOf(status);
  return (
    <div className="track" style={{ gridTemplateColumns: `repeat(${flow.length},1fr)` }}>
      {flow.map((s, k) => (
        <div key={s} className={k <= i ? 'done' : ''}>
          {s === 'entregue' && retirada ? 'Retirado' : STATUS[s]}
        </div>
      ))}
    </div>
  );
}

export function Logo({ nome, cor, size = 48 }: { nome: string; cor: string; size?: number }) {
  const ini = nome.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="dlogo" style={{ background: cor, width: size, height: size, fontSize: size * 0.4 }}>
      {ini}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
