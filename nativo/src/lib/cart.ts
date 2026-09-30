import './storage';
import { useSyncExternalStore } from 'react';

/** Carrinho (salvo no aparelho) e endereço da sessão (só na memória: não fica pré-definido). */
/** items: produtos (id → quantidade); premios: prêmios trocados com pontos (id → quantidade). */
export type Cart = { distId: string | null; items: Record<string, number>; premios?: Record<string, number> };
export type Endereco = { retirada: true } | { retirada?: false; bairro_id: number; bairro: string; cidade: string; rua: string; comp: string };

const CART_KEY = 'dp_cart_v1';
const EMPTY_CART: Cart = { distId: null, items: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

let cart: Cart | null = null;
let endereco: Endereco | null = null;

function loadCart(): Cart {
  if (cart) return cart;
  try {
    const s = localStorage.getItem(CART_KEY);
    cart = s ? (JSON.parse(s) as Cart) : EMPTY_CART;
  } catch {
    cart = EMPTY_CART;
  }
  return cart;
}

function subscribe(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

export const getCart = (): Cart => loadCart();
export function setCart(c: Cart) {
  cart = c;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  } catch {
    /* sem armazenamento: fica só na memória */
  }
  emit();
}
export const clearCart = () => setCart(EMPTY_CART);
export const getEndereco = (): Endereco | null => endereco;
export function setEndereco(e: Endereco | null) {
  endereco = e;
  emit();
}

export const useCart = () => useSyncExternalStore(subscribe, getCart, getCart);
export const useEndereco = () => useSyncExternalStore(subscribe, getEndereco, getEndereco);

export function addToCart(distId: string, productId: string, delta: number, max: number): 'ok' | 'trocou' | 'limite' {
  const c = getCart();
  let res: 'ok' | 'trocou' | 'limite' = 'ok';
  let items = c.items;
  let premios = c.premios ?? {};
  if (c.distId && c.distId !== distId && cartCount(c)) {
    items = {};
    premios = {};
    res = 'trocou';
  }
  const q = (items[productId] ?? 0) + delta;
  if (delta > 0 && q > max) return 'limite';
  const next = { ...items };
  if (q <= 0) delete next[productId];
  else next[productId] = q;
  setCart({ distId: Object.keys(next).length || Object.keys(premios).length ? distId : null, items: next, premios });
  return res;
}

/** Total de unidades no carrinho (produtos + prêmios). */
export const cartCount = (c: Cart) =>
  Object.values(c.items).reduce((a, b) => a + b, 0) + Object.values(c.premios ?? {}).reduce((a, b) => a + b, 0);

/** Coloca (ou tira) um prêmio no carrinho. O saldo é conferido por quem chama e de novo no servidor. */
export function addRewardToCart(distId: string, rewardId: string, delta: number): 'ok' | 'trocou' {
  const c = getCart();
  let res: 'ok' | 'trocou' = 'ok';
  let items = c.items;
  let premios = c.premios ?? {};
  if (c.distId && c.distId !== distId && cartCount(c)) {
    items = {};
    premios = {};
    res = 'trocou';
  }
  const q = (premios[rewardId] ?? 0) + delta;
  const next = { ...premios };
  if (q <= 0) delete next[rewardId];
  else next[rewardId] = q;
  const vazio = !Object.keys(items).length && !Object.keys(next).length;
  setCart({ distId: vazio ? null : distId, items, premios: next });
  return res;
}
