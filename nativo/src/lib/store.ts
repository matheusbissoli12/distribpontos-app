/** Regras de horário e frete calculadas no navegador (o banco confere de novo no pedido). */
import type { Area, Distributor } from './types';

export function nowInTz(tz = 'America/Sao_Paulo'): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: tz }).format(new Date());
}

export function isOpen(d: Pick<Distributor, 'status' | 'pausada' | 'horario_abre' | 'horario_fecha' | 'timezone'>): boolean {
  if (d.status !== 'ativa' || d.pausada) return false;
  const t = nowInTz(d.timezone);
  return t >= d.horario_abre.slice(0, 8).padEnd(8, ':00') && t < d.horario_fecha.slice(0, 8).padEnd(8, ':00');
}

export function openText(d: Distributor): string {
  const abre = d.horario_abre.slice(0, 5);
  const fecha = d.horario_fecha.slice(0, 5);
  if (d.pausada) return 'Pausada no momento';
  if (isOpen(d)) return `Aberta até ${fecha}`;
  const t = nowInTz(d.timezone).slice(0, 5);
  return `Fechada · abre ${t < abre ? 'hoje' : 'amanhã'} às ${abre}`;
}

export function freteFor(d: Distributor, area: Area | undefined, subtotal: number): number | null {
  if (!area) return null;
  const taxa = Number(area.taxa);
  if (taxa > 0 && Number(d.frete_gratis_acima) > 0 && subtotal >= Number(d.frete_gratis_acima)) return 0;
  return taxa;
}

export function tierMult(nivel?: string) {
  return nivel === 'Ouro' ? 1.5 : nivel === 'Prata' ? 1.25 : 1;
}
