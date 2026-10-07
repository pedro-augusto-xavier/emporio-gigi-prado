/** Chamadas à API. Em desenvolvimento o Vite repassa /api para http://localhost:3333. */

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  /** Nulo = "Consulte" (não tem preço fixo). */
  priceCents: number | null;
  imageUrl: string | null;
}

/** Aba do cardápio em que a categoria aparece. */
export type MenuSection = 'almoco' | 'cafe' | 'bebidas';

export interface MenuCategory {
  id: string;
  name: string;
  section: MenuSection;
  items: MenuItem[];
}

export async function fetchMenu(signal?: AbortSignal): Promise<MenuCategory[]> {
  const response = await fetch('/api/menu', { signal });
  if (!response.ok) throw new Error(`Erro ${response.status} ao carregar o cardápio`);
  const body = (await response.json()) as { categories: MenuCategory[] };
  return body.categories;
}

/** Erro vindo da API, com o código (ex.: NO_AVAILABILITY) e a mensagem pronta para mostrar. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Sem conexão com o servidor. Tente de novo em instantes.');
  }
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    issues?: { message: string }[];
  };
  if (!response.ok) {
    // Em erro de validação, a primeira explicação ("Telefone inválido...") ajuda mais que "Dados inválidos".
    const message = body.issues?.[0]?.message ?? body.message ?? 'Algo deu errado. Tente de novo.';
    throw new ApiError(response.status, body.error ?? 'ERROR', message);
  }
  return body as T;
}

export interface Slot {
  startsAt: string;
  available: boolean;
}

export function fetchAvailability(date: string, partySize: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ date, partySize: String(partySize) });
  return request<{ slots: Slot[] }>(`/api/reservations/availability?${query}`, { signal }).then((r) => r.slots);
}

export interface NewReservation {
  name: string;
  phone: string;
  email?: string;
  partySize: number;
  startsAt: string;
  notes?: string;
  acceptPrivacy: boolean;
}

export interface Reservation {
  code: string;
  name: string;
  partySize: number;
  startsAt: string;
  status: string;
}

export function createReservation(data: NewReservation) {
  return request<Reservation>('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});
const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** Horário no fuso do restaurante, não no do celular de quem está reservando. */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export function formatDay(iso: string): string {
  return dateFormat.format(new Date(iso));
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(cents: number | null): string {
  return cents === null ? 'Consulte' : currency.format(cents / 100);
}
