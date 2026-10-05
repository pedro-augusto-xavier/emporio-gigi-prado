import type { RestaurantConfig } from '../../config/restaurant.js';
import type { OrderStatus, OrderType } from '../../db/schema.js';
import { localDateOf, localToUtc, weekdayOf } from '../reservations/availability.js';

// Funções puras (sem banco) para facilitar os testes unitários.

/** Restaurante aberto agora? Pedidos só são aceitos dentro do horário de funcionamento. */
export function isOpenAt(instant: Date, config: RestaurantConfig): boolean {
  const date = localDateOf(instant, config);
  const windows = config.openingHours[weekdayOf(date)] ?? [];
  return windows.some(([open, close]) => {
    const start = localToUtc(date, open, config);
    const end = localToUtc(date, close, config);
    return instant >= start && instant < end;
  });
}

/** Pedido já aceito pelo restaurante e ainda não finalizado. */
export const IN_PROGRESS_STATUSES = ['confirmed', 'preparing', 'ready', 'out_for_delivery'] as const;

const FLOW: Record<OrderType, readonly OrderStatus[]> = {
  delivery: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'],
  pickup: ['pending', 'confirmed', 'preparing', 'ready', 'completed'],
};

/**
 * O pedido só anda para frente, mas pode pular etapas (num dia corrido ninguém
 * vai clicar em todas). Cancelar é possível até ser concluído.
 */
export function canTransition(type: OrderType, from: OrderStatus, to: OrderStatus): boolean {
  if (from === 'completed' || from === 'cancelled') return false;
  if (to === 'cancelled') return true;
  const flow = FLOW[type];
  return flow.includes(to) && flow.indexOf(to) > flow.indexOf(from);
}

export function orderTotalCents(order: { itemsSubtotalCents: number; deliveryFeeCents: number | null }): number | null {
  return order.deliveryFeeCents === null ? null : order.itemsSubtotalCents + order.deliveryFeeCents;
}
