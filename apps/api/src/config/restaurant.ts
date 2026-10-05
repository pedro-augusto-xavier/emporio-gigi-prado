/** Faixa de funcionamento no formato "HH:MM" (horário local do restaurante). */
export type OpeningWindow = readonly [start: string, end: string];

export interface RestaurantConfig {
  /** Brasil não tem horário de verão desde 2019, então um offset fixo basta. */
  utcOffset: string;
  slotMinutes: number;
  reservationDurationMinutes: number;
  /** Antecedência mínima para reservar. */
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  maxPartySize: number;
  /** Índice = dia da semana (0 = domingo). Lista vazia = fechado. */
  openingHours: readonly (readonly OpeningWindow[])[];
}

export const defaultRestaurantConfig: RestaurantConfig = {
  utcOffset: '-03:00',
  slotMinutes: 30,
  reservationDurationMinutes: 90,
  minAdvanceMinutes: 60,
  maxAdvanceDays: 30,
  maxPartySize: 12,
  // Empório Gigi Prado: aberto de quarta a domingo.
  // Horários tirados do Tripadvisor (out/2026). TODO: confirmar com a Gigi.
  openingHours: [
    [['10:00', '18:00']], // domingo
    [], // segunda: fechado
    [], // terça: fechado
    [['11:00', '18:00']], // quarta
    [['11:00', '18:00']], // quinta
    [['11:00', '19:00']], // sexta
    [['10:00', '19:00']], // sábado
  ],
};
