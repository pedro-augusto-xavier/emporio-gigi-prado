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

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export async function fetchMenu(signal?: AbortSignal): Promise<MenuCategory[]> {
  const response = await fetch('/api/menu', { signal });
  if (!response.ok) throw new Error(`Erro ${response.status} ao carregar o cardápio`);
  const body = (await response.json()) as { categories: MenuCategory[] };
  return body.categories;
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(cents: number | null): string {
  return cents === null ? 'Consulte' : currency.format(cents / 100);
}
