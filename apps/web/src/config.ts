/** Dados do restaurante usados em vários lugares do site. */
export const restaurant = {
  name: 'Empório Gigi Prado',
  whatsappNumber: '5522992339210',
  whatsappDisplay: '(22) 99233-9210',
  instagramHandle: 'emporiogigiprado',
  openDays: 'Quarta a domingo',
  address: 'Av. Manoel Carneiro de Menezes, 3471 - Mury, Nova Friburgo - RJ, 28615-060',
  tripadvisorUrl:
    'https://www.tripadvisor.com.br/Restaurant_Review-g303501-d24001318-Reviews-Emporio_Gigi_Prado-Nova_Friburgo_State_of_Rio_de_Janeiro.html',
};

/** Fonte: Tripadvisor (out/2026). TODO: confirmar com a Gigi. Igual a apps/api/src/config/restaurant.ts. */
export const openingHours = [
  { days: 'Quarta e quinta', hours: '11h às 18h' },
  { days: 'Sexta', hours: '11h às 19h' },
  { days: 'Sábado', hours: '10h às 19h' },
  { days: 'Domingo', hours: '10h às 18h' },
  { days: 'Segunda e terça', hours: 'Fechado' },
];

/** Dias da semana em que o restaurante não abre (0 = domingo). */
export const closedWeekdays = [1, 2];

export function whatsappLink(message = 'Olá! Vim pelo site do Empório.') {
  return `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const instagramLink = `https://instagram.com/${restaurant.instagramHandle}`;

export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${restaurant.name}, ${restaurant.address}`,
)}`;
