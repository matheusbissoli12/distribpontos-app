export const onlyDigits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const num = (v: number) => Math.round(v).toLocaleString('pt-BR');

/** Converte "12,50" ou "12.50" em número. */
export function parseMoney(v: string): number {
  const s = (v ?? '').trim();
  if (!s) return NaN;
  return parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
}

export function maskCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function maskCel(v: string) {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
  if (d.length < 3) return d;
  if (d.length < 8) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function cpfValid(c: string) {
  c = onlyDigits(c);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
    const r = ((s * 10) % 11) % 10;
    if (r !== +c[t]) return false;
  }
  return true;
}

export const celHide = (c?: string | null) => {
  const d = onlyDigits(c).replace(/^55/, '');
  return d.length >= 10 ? `(${d.slice(0, 2)}) •••••-${d.slice(-4)}` : '';
};

/** Número brasileiro em formato E.164 (+55...). */
export const toE164 = (cel: string) => {
  const d = onlyDigits(cel).replace(/^55(?=\d{10,11}$)/, '');
  return `+55${d}`;
};

export const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const hora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '';

export const dataHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : '';

export const STATUS: Record<string, string> = {
  aguardando_pagamento: 'Aguardando Pix',
  novo: 'Recebido',
  separando: 'Separando',
  em_rota: 'Saiu p/ entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const PAG: Record<string, string> = { pix: 'Pix', cartao: 'Cartão na entrega', dinheiro: 'Dinheiro' };

export const CATEGORIAS = ['Cervejas', 'Refrigerantes', 'Águas', 'Energéticos', 'Gás', 'Conveniência', 'Acessórios', 'Outros'];

/** Mensagem legível de um erro do Supabase/Postgres. */
export function errMsg(e: unknown): string {
  if (!e) return 'Erro desconhecido.';
  if (typeof e === 'string') return e;
  const m = (e as { message?: string }).message;
  return m || 'Algo deu errado. Tente de novo.';
}
