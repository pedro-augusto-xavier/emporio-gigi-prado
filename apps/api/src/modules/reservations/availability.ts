import type { RestaurantConfig } from '../../config/restaurant.js';

// Funções puras (sem banco) para facilitar os testes unitários.

const MINUTE = 60_000;

function offsetMinutes(utcOffset: string): number {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(utcOffset);
  if (!match) throw new Error(`utcOffset inválido: ${utcOffset}`);
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

/** "2026-10-07" + "19:30" no fuso do restaurante -> instante UTC. */
export function localToUtc(date: string, time: string, config: RestaurantConfig): Date {
  return new Date(`${date}T${time}:00${config.utcOffset}`);
}

/** Data local (YYYY-MM-DD) do restaurante para um instante. */
export function localDateOf(instant: Date, config: RestaurantConfig): string {
  return new Date(instant.getTime() + offsetMinutes(config.utcOffset) * MINUTE).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Horários de início possíveis num dia: a reserva inteira precisa caber no horário de funcionamento. */
export function generateSlots(date: string, config: RestaurantConfig): Date[] {
  const windows = config.openingHours[weekdayOf(date)] ?? [];
  const durationMs = config.reservationDurationMinutes * MINUTE;
  const slots: Date[] = [];
  for (const [open, close] of windows) {
    const end = localToUtc(date, close, config).getTime();
    for (let t = localToUtc(date, open, config).getTime(); t + durationMs <= end; t += config.slotMinutes * MINUTE) {
      slots.push(new Date(t));
    }
  }
  return slots;
}

export function isSlotStart(instant: Date, config: RestaurantConfig): boolean {
  return generateSlots(localDateOf(instant, config), config).some((slot) => slot.getTime() === instant.getTime());
}

/** Respeita a antecedência mínima e o limite máximo de dias à frente. */
export function isWithinBookingWindow(instant: Date, now: Date, config: RestaurantConfig): boolean {
  const earliest = now.getTime() + config.minAdvanceMinutes * MINUTE;
  const latest = now.getTime() + config.maxAdvanceDays * 24 * 60 * MINUTE;
  return instant.getTime() >= earliest && instant.getTime() <= latest;
}

export function reservationEnd(start: Date, config: RestaurantConfig): Date {
  return new Date(start.getTime() + config.reservationDurationMinutes * MINUTE);
}

export interface BookedInterval {
  partySize: number;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Maior número de pessoas no restaurante ao mesmo tempo dentro do intervalo.
 * A lotação só aumenta quando uma reserva começa, então basta olhar o início
 * do intervalo e o início de cada reserva que cai dentro dele.
 */
export function peakOccupancy(start: Date, end: Date, booked: readonly BookedInterval[]): number {
  const moments = [start, ...booked.map((b) => b.startsAt).filter((t) => t > start && t < end)];
  let peak = 0;
  for (const moment of moments) {
    const people = booked
      .filter((b) => b.startsAt <= moment && moment < b.endsAt)
      .reduce((sum, b) => sum + b.partySize, 0);
    peak = Math.max(peak, people);
  }
  return peak;
}

/**
 * As mesas da casa se juntam e se separam conforme o grupo, então o controle é
 * pela lotação: cabe se, no pior momento da reserva, ninguém passa da capacidade.
 */
export function hasRoom(
  capacity: number,
  partySize: number,
  start: Date,
  end: Date,
  booked: readonly BookedInterval[],
): boolean {
  return peakOccupancy(start, end, booked) + partySize <= capacity;
}
