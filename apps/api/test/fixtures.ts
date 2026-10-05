import type { RestaurantConfig } from '../src/config/restaurant.js';

/**
 * Horários fixos só para os testes: assim mudar o horário real do restaurante
 * (src/config/restaurant.ts) não quebra nenhum teste.
 */
export const testRestaurantConfig: RestaurantConfig = {
  utcOffset: '-03:00',
  slotMinutes: 30,
  reservationDurationMinutes: 90,
  minAdvanceMinutes: 60,
  maxAdvanceDays: 30,
  maxPartySize: 12,
  openingHours: [
    [['11:00', '16:00']], // domingo
    [], // segunda: fechado
    [['11:00', '15:00'], ['18:00', '23:00']],
    [['11:00', '15:00'], ['18:00', '23:00']],
    [['11:00', '15:00'], ['18:00', '23:00']],
    [['11:00', '15:00'], ['18:00', '23:30']],
    [['11:00', '16:00'], ['18:00', '23:30']], // sábado
  ],
};
