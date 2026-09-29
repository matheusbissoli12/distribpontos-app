'use client';
import { createContext, useContext } from 'react';
import type { Distributor, Member } from '@/lib/types';

export type PanelState = { d: Distributor; role: 'dono' | 'caixa' | 'entregador'; userId: string; members: Member[]; reload: () => Promise<void> };
export const PanelCtx = createContext<PanelState | null>(null);
export const usePanel = () => {
  const v = useContext(PanelCtx);
  if (!v) throw new Error('Painel sem contexto');
  return v;
};
