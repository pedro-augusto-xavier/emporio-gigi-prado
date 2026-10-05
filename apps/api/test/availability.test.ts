import { describe, expect, it } from 'vitest';
import { testRestaurantConfig as config } from './fixtures.js';
import {
  generateSlots,
  isSlotStart,
  isWithinBookingWindow,
  localDateOf,
  pickTable,
} from '../src/modules/reservations/availability.js';

// 2026-10-07 é uma quarta-feira; 2026-10-05 é segunda (fechado).
const WEDNESDAY = '2026-10-07';

describe('generateSlots', () => {
  it('não gera horários em dia fechado', () => {
    expect(generateSlots('2026-10-05', config)).toEqual([]);
  });

  it('gera horários de 30 em 30 minutos cabendo a reserva de 90 minutos', () => {
    const slots = generateSlots(WEDNESDAY, config).map((slot) => slot.toISOString());
    // Almoço 11:00-15:00 (-03:00) -> último início 13:30 local = 16:30Z
    expect(slots[0]).toBe('2026-10-07T14:00:00.000Z');
    expect(slots).toContain('2026-10-07T16:30:00.000Z');
    expect(slots).not.toContain('2026-10-07T17:00:00.000Z');
    // Jantar 18:00-23:00 -> último início 21:30 local = 00:30Z do dia seguinte
    expect(slots.at(-1)).toBe('2026-10-08T00:30:00.000Z');
  });
});

describe('isSlotStart / localDateOf', () => {
  it('usa a data local do restaurante, não a UTC', () => {
    const lateDinner = new Date('2026-10-08T00:30:00.000Z');
    expect(localDateOf(lateDinner, config)).toBe(WEDNESDAY);
    expect(isSlotStart(lateDinner, config)).toBe(true);
  });

  it('recusa horário fora da grade', () => {
    expect(isSlotStart(new Date('2026-10-07T22:10:00-03:00'), config)).toBe(false);
    expect(isSlotStart(new Date('2026-10-07T16:00:00-03:00'), config)).toBe(false);
  });
});

describe('isWithinBookingWindow', () => {
  const now = new Date('2026-10-07T10:00:00-03:00');

  it('exige antecedência mínima', () => {
    expect(isWithinBookingWindow(new Date('2026-10-07T10:30:00-03:00'), now, config)).toBe(false);
    expect(isWithinBookingWindow(new Date('2026-10-07T11:00:00-03:00'), now, config)).toBe(true);
  });

  it('limita a quantidade de dias à frente', () => {
    expect(isWithinBookingWindow(new Date('2026-12-01T12:00:00-03:00'), now, config)).toBe(false);
  });
});

describe('pickTable', () => {
  const tables = [
    { id: 'big', label: 'Mesa 08', seats: 8 },
    { id: 'small', label: 'Mesa 02', seats: 2 },
    { id: 'medium', label: 'Mesa 04', seats: 4 },
  ];
  const start = new Date('2026-10-07T19:00:00-03:00');
  const end = new Date('2026-10-07T20:30:00-03:00');

  it('escolhe a menor mesa que comporta o grupo', () => {
    expect(pickTable(tables, 2, start, end, [])?.id).toBe('small');
    expect(pickTable(tables, 3, start, end, [])?.id).toBe('medium');
    expect(pickTable(tables, 9, start, end, [])).toBeNull();
  });

  it('pula mesas ocupadas em horário sobreposto', () => {
    const booked = [{ tableId: 'small', startsAt: new Date('2026-10-07T18:00:00-03:00'), endsAt: new Date('2026-10-07T19:30:00-03:00') }];
    expect(pickTable(tables, 2, start, end, booked)?.id).toBe('medium');
  });

  it('reserva que termina exatamente quando a outra começa não conflita', () => {
    const booked = [{ tableId: 'small', startsAt: new Date('2026-10-07T17:30:00-03:00'), endsAt: start }];
    expect(pickTable(tables, 2, start, end, booked)?.id).toBe('small');
  });
});
