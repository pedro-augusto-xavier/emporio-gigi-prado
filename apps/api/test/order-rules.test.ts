import { describe, expect, it } from 'vitest';
import { testRestaurantConfig as config } from './fixtures.js';
import { canTransition, isOpenAt, orderTotalCents } from '../src/modules/orders/rules.js';

describe('isOpenAt', () => {
  it('respeita as faixas de horário e os dias fechados', () => {
    expect(isOpenAt(new Date('2026-10-07T12:00:00-03:00'), config)).toBe(true); // quarta, almoço
    expect(isOpenAt(new Date('2026-10-07T16:00:00-03:00'), config)).toBe(false); // entre almoço e jantar
    expect(isOpenAt(new Date('2026-10-07T22:59:00-03:00'), config)).toBe(true);
    expect(isOpenAt(new Date('2026-10-07T23:00:00-03:00'), config)).toBe(false); // fechou
    expect(isOpenAt(new Date('2026-10-05T12:00:00-03:00'), config)).toBe(false); // segunda
  });
});

describe('canTransition', () => {
  it('anda para frente, podendo pular etapas', () => {
    expect(canTransition('delivery', 'pending', 'confirmed')).toBe(true);
    expect(canTransition('delivery', 'confirmed', 'out_for_delivery')).toBe(true);
    expect(canTransition('pickup', 'pending', 'completed')).toBe(true);
  });

  it('não volta etapas nem repete a mesma', () => {
    expect(canTransition('delivery', 'preparing', 'confirmed')).toBe(false);
    expect(canTransition('delivery', 'ready', 'ready')).toBe(false);
  });

  it('retirada não sai para entrega', () => {
    expect(canTransition('pickup', 'ready', 'out_for_delivery')).toBe(false);
  });

  it('cancela até concluir; depois de concluído ou cancelado, nada muda', () => {
    expect(canTransition('delivery', 'out_for_delivery', 'cancelled')).toBe(true);
    expect(canTransition('delivery', 'completed', 'cancelled')).toBe(false);
    expect(canTransition('delivery', 'cancelled', 'confirmed')).toBe(false);
  });
});

describe('orderTotalCents', () => {
  it('só tem total depois de definida a taxa', () => {
    expect(orderTotalCents({ itemsSubtotalCents: 5000, deliveryFeeCents: null })).toBeNull();
    expect(orderTotalCents({ itemsSubtotalCents: 5000, deliveryFeeCents: 700 })).toBe(5700);
  });
});
