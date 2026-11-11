import { cardapio } from '../../api/src/menu/cardapio';
import type { MenuCategory } from './api';

/**
 * Cardápio embutido no site: abre na hora, sem esperar a API.
 * A fonte continua sendo apps/api/src/menu/cardapio.ts; ao mudar lá, o site é publicado de novo com o novo cardápio.
 */
export const menu: MenuCategory[] = cardapio.map((category, i) => ({
  id: String(i),
  name: category.name,
  section: category.section,
  items: category.items.map((item, j) => ({
    id: `${i}-${j}`,
    categoryId: String(i),
    name: item.name,
    description: item.description ?? null,
    priceCents: item.price === null ? null : Math.round(item.price * 100),
    imageUrl: null,
  })),
}));
