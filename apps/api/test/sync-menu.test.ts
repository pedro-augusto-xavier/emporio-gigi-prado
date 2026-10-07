import { asc } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { menuCategories, menuItems } from '../src/db/schema.js';
import { syncMenu } from '../src/db/sync-menu.js';
import { cardapio, type MenuCategoryData } from '../src/menu/cardapio.js';
import { createTestApp, type TestContext } from './helpers.js';

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(() => ctx.close());

const small: MenuCategoryData[] = [
  {
    name: 'Massas',
    section: 'almoco',
    items: [
      { name: 'Massa com Camarões', price: 80 },
      { name: 'Massa com Cogumelos', description: 'Molho branco', price: 68.5 },
    ],
  },
  { name: 'Bebidas', section: 'bebidas', items: [{ name: 'Vinhos', price: null }] },
];

describe('sincronização do cardápio', () => {
  it('cria categorias e pratos na ordem do arquivo, com preço em centavos', async () => {
    expect(await syncMenu(ctx.db, small)).toBe(true);

    const response = await ctx.app.inject({ method: 'GET', url: '/api/menu' });
    expect(response.json().categories).toEqual([
      {
        id: expect.any(String),
        name: 'Massas',
        section: 'almoco',
        items: [
          expect.objectContaining({ name: 'Massa com Camarões', priceCents: 8000, description: null }),
          expect.objectContaining({ name: 'Massa com Cogumelos', priceCents: 6850, description: 'Molho branco' }),
        ],
      },
      {
        id: expect.any(String),
        name: 'Bebidas',
        section: 'bebidas',
        items: [expect.objectContaining({ name: 'Vinhos', priceCents: null })],
      },
    ]);
  });

  it('não mexe no banco se o arquivo não mudou', async () => {
    const before = await ctx.db.select({ id: menuItems.id }).from(menuItems).orderBy(asc(menuItems.id));
    expect(await syncMenu(ctx.db, small)).toBe(false);
    const after = await ctx.db.select({ id: menuItems.id }).from(menuItems).orderBy(asc(menuItems.id));
    expect(after).toEqual(before);
  });

  it('quando o arquivo muda, o cardápio antigo é trocado pelo novo', async () => {
    const changed = [{ ...small[0]!, items: [{ name: 'Massa com Camarões', price: 82 }] }];
    expect(await syncMenu(ctx.db, changed)).toBe(true);

    const categories = await ctx.db.select().from(menuCategories);
    const items = await ctx.db.select().from(menuItems);
    expect(categories.map((c) => c.name)).toEqual(['Massas']);
    expect(items).toEqual([expect.objectContaining({ name: 'Massa com Camarões', priceCents: 8200 })]);
  });

  it('o cardápio real do Empório é válido', async () => {
    expect(await syncMenu(ctx.db, cardapio)).toBe(true);
    const response = await ctx.app.inject({ method: 'GET', url: '/api/menu' });
    const categories = response.json().categories as { name: string; section: string; items: unknown[] }[];

    expect(new Set(categories.map((c) => c.section))).toEqual(new Set(['almoco', 'cafe', 'bebidas']));
    expect(categories[0]!.name).toBe('Sugestões do Chef');
    for (const category of cardapio) {
      for (const item of category.items) {
        // Preço com no máximo 2 casas (centavos) e nunca negativo.
        if (item.price !== null) expect(Math.round(item.price * 100)).toBe(item.price * 100);
        if (item.price !== null) expect(item.price).toBeGreaterThan(0);
      }
    }
  });
});
