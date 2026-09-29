'use client';
import { useSyncExternalStore } from 'react';

/** Carrinho (localStorage) e endereço da sessão (sessionStorage: não fica pré-definido). */
export type Cart = { distId: string | null; items: Record<string, number> };
export type Endereco = { retirada: true } | { retirada?: false; bairro_id: number; bairro: string; cidade: string; rua: string; comp: string };

const CART_KEY = 'dp_cart_v1';
const END_KEY = 'dp_endereco_v1';
const EMPTY_CART: Cart = { distId: null, items: {} };
const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();
const emit = () => listeners.forEach((f) => f());

function storageOf(kind: 'local' | 'session'): Storage | null {
  try {
    return typeof window === 'undefined' ? null : kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}
function read<T>(kind: 'local' | 'session', key: string, fallback: T): T {
  const k = kind + ':' + key;
  if (cache.has(k)) return cache.get(k) as T;
  let v: T = fallback;
  try {
    const s = storageOf(kind)?.getItem(key);
    if (s) v = JSON.parse(s) as T;
  } catch {
    v = fallback;
  }
  cache.set(k, v);
  return v;
}
function write(kind: 'local' | 'session', key: string, v: unknown) {
  cache.set(kind + ':' + key, v);
  try {
    const st = storageOf(kind);
    if (v === null) st?.removeItem(key);
    else st?.setItem(key, JSON.stringify(v));
  } catch {
    /* navegador bloqueou armazenamento: fica só na memória */
  }
  emit();
}

function subscribe(f: () => void) {
  listeners.add(f);
  const onStorage = () => { cache.clear(); f(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener('storage', onStorage);
  };
}

export const getCart = (): Cart => read('local', CART_KEY, EMPTY_CART);
export const setCart = (c: Cart) => write('local', CART_KEY, c);
export const clearCart = () => write('local', CART_KEY, EMPTY_CART);
export const getEndereco = (): Endereco | null => read<Endereco | null>('session', END_KEY, null);
export const setEndereco = (e: Endereco | null) => write('session', END_KEY, e);

export const useCart = () => useSyncExternalStore(subscribe, getCart, () => EMPTY_CART);
export const useEndereco = () => useSyncExternalStore(subscribe, getEndereco, () => null);

export function addToCart(distId: string, productId: string, delta: number, max: number): 'ok' | 'trocou' | 'limite' {
  const c = getCart();
  let res: 'ok' | 'trocou' | 'limite' = 'ok';
  let items = c.items;
  if (c.distId && c.distId !== distId && Object.keys(c.items).length) {
    items = {};
    res = 'trocou';
  }
  const q = (items[productId] ?? 0) + delta;
  if (delta > 0 && q > max) return 'limite';
  const next = { ...items };
  if (q <= 0) delete next[productId];
  else next[productId] = q;
  setCart({ distId: Object.keys(next).length ? distId : null, items: next });
  return res;
}
