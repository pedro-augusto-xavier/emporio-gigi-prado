import { describe, expect, it } from 'vitest';
import { testRestaurantConfig as config } from './fixtures.js';
import {
  generateSlots,
  isSlotStart,
  isWithinBookingWindow,
  localDateOf,
  hasRoom,
  peakOccupancy,
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

describe('lotação (hasRoom / peakOccupancy)', () => {
  const at = (time: string) => new Date(`2026-10-07T${time}:00-03:00`);
  const start = at('19:00');
  const end = at('20:30');

  it('soma as pessoas das reservas que se sobrepõem', () => {
    const booked = [
      { partySize: 2, startsAt: at('18:00'), endsAt: at('19:30') },
      { partySize: 3, startsAt: at('19:00'), endsAt: at('20:30') },
    ];
    expect(peakOccupancy(start, end, booked)).toBe(5);
    expect(hasRoom(6, 1, start, end, booked)).toBe(true);
    expect(hasRoom(6, 2, start, end, booked)).toBe(false);
  });

  it('considera o pior momento, não só o começo da reserva', () => {
    // Às 19h tem 2 pessoas; às 20h chegam mais 4 -> pico de 6 durante a reserva das 19h.
    const booked = [
      { partySize: 2, startsAt: at('18:30'), endsAt: at('20:00') },
      { partySize: 4, startsAt: at('19:30'), endsAt: at('21:00') },
    ];
    expect(peakOccupancy(start, end, booked)).toBe(6);
    expect(hasRoom(8, 2, start, end, booked)).toBe(true);
    expect(hasRoom(8, 3, start, end, booked)).toBe(false);
  });

  it('reserva que termina exatamente quando a outra começa não conta', () => {
    const booked = [{ partySize: 6, startsAt: at('17:30'), endsAt: start }];
    expect(peakOccupancy(start, end, booked)).toBe(0);
    expect(hasRoom(6, 6, start, end, booked)).toBe(true);
  });

  it('grupo maior que a casa inteira nunca cabe', () => {
    expect(hasRoom(6, 7, start, end, [])).toBe(false);
  });
});
