import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, loginAs, registerUser, type TestContext } from './helpers.js';

let ctx: TestContext;
let adminToken: string;
let staffToken: string;

beforeAll(async () => {
  ctx = await createTestApp();
  adminToken = await loginAs(ctx, 'admin');
  staffToken = await loginAs(ctx, 'staff');
});
afterAll(() => ctx.close());

async function createCategory(name: string, position = 0) {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/admin/menu/categories',
    headers: bearer(adminToken),
    payload: { name, position },
  });
  return response.json() as { id: string };
}

async function createItem(categoryId: string, name: string, priceCents = 1000) {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/admin/menu/items',
    headers: bearer(adminToken),
    payload: { categoryId, name, priceCents },
  });
  expect(response.statusCode).toBe(201);
  return response.json() as { id: string };
}

describe('cardápio', () => {
  it('admin monta o cardápio e o público só vê itens disponíveis', async () => {
    const drinks = await createCategory('Bebidas', 2);
    const dishes = await createCategory('Pratos', 1);
    await createCategory('Sobremesas (vazia)', 3);
    await createItem(dishes.id, 'Feijoada', 4990);
    const soldOut = await createItem(drinks.id, 'Suco de caju', 1200);
    await createItem(drinks.id, 'Água', 500);

    await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/menu/items/${soldOut.id}`,
      headers: bearer(adminToken),
      payload: { available: false },
    });

    const menu = await ctx.app.inject({ method: 'GET', url: '/api/menu' });
    expect(menu.statusCode).toBe(200);
    expect(menu.json()).toEqual({
      categories: [
        { id: dishes.id, name: 'Pratos', section: 'almoco', items: [expect.objectContaining({ name: 'Feijoada', priceCents: 4990 })] },
        { id: drinks.id, name: 'Bebidas', section: 'almoco', items: [expect.objectContaining({ name: 'Água' })] },
      ],
    });
  });

  it('cliente não acessa rotas de administração', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'cliente-menu@example.com' });
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/admin/menu/categories',
      headers: bearer(accessToken),
      payload: { name: 'Hack' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('atendente só pode mudar a disponibilidade, não o preço', async () => {
    const category = await createCategory('Lanches');
    const item = await createItem(category.id, 'X-Burguer', 2500);

    const toggle = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/menu/items/${item.id}`,
      headers: bearer(staffToken),
      payload: { available: false },
    });
    expect(toggle.statusCode).toBe(200);

    const price = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/menu/items/${item.id}`,
      headers: bearer(staffToken),
      payload: { priceCents: 1 },
    });
    expect(price.statusCode).toBe(400);
  });

  it('não apaga categoria com itens', async () => {
    const category = await createCategory('Massas');
    await createItem(category.id, 'Lasanha');
    const response = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/admin/menu/categories/${category.id}`,
      headers: bearer(adminToken),
    });
    expect(response.statusCode).toBe(409);
  });

  it('valida preço e imagem', async () => {
    const category = await createCategory('Validação');
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/admin/menu/items',
      headers: bearer(adminToken),
      payload: { categoryId: category.id, name: 'X', priceCents: -5, imageUrl: 'javascript:alert(1)' },
    });
    expect(response.statusCode).toBe(400);
    const paths = response.json().issues.map((issue: { path: string }) => issue.path);
    expect(paths).toEqual(expect.arrayContaining(['priceCents', 'imageUrl']));
  });
});
