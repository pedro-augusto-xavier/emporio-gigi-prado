import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, loginAs, registerUser, validRegistration, type TestContext } from './helpers.js';

// Quarta-feira, 07/10/2026, 12:00 em Brasília: restaurante aberto.
const OPEN = new Date('2026-10-07T12:00:00-03:00');

let ctx: TestContext;
let adminToken: string;
let staffToken: string;
let feijoada: string; // R$ 49,90
let suco: string; // R$ 12,00
let esgotado: string;
let vinho: string; // preço "Consulte"

const customer = { name: 'Ana Cliente', phone: '(11) 95555-4444', acceptPrivacy: true };
const address = { street: 'Rua das Flores', number: '123', district: 'Centro', city: 'São Paulo', zipCode: '01001-000' };

function order(payload: Record<string, unknown>, headers: Record<string, string> = {}) {
  return ctx.app.inject({
    method: 'POST',
    url: '/api/orders',
    headers,
    payload: { ...customer, type: 'pickup', paymentMethod: 'pix', items: [{ menuItemId: feijoada, quantity: 1 }], ...payload },
  });
}

function setStatus(id: string, payload: Record<string, unknown>, token = staffToken) {
  return ctx.app.inject({ method: 'PATCH', url: `/api/admin/orders/${id}/status`, headers: bearer(token), payload });
}

async function staffIdOf(code: string): Promise<string> {
  const list = await ctx.app.inject({ method: 'GET', url: '/api/admin/orders?date=2026-10-07', headers: bearer(staffToken) });
  return list.json().find((o: { code: string }) => o.code === code).id;
}

beforeAll(async () => {
  ctx = await createTestApp({ now: OPEN });
  adminToken = await loginAs(ctx, 'admin');
  staffToken = await loginAs(ctx, 'staff');

  const admin = (url: string, payload: object) =>
    ctx.app.inject({ method: 'POST', url, headers: bearer(adminToken), payload }).then((r) => r.json().id as string);
  const categoryId = await admin('/api/admin/menu/categories', { name: 'Pratos' });
  feijoada = await admin('/api/admin/menu/items', { categoryId, name: 'Feijoada', priceCents: 4990 });
  suco = await admin('/api/admin/menu/items', { categoryId, name: 'Suco', priceCents: 1200 });
  esgotado = await admin('/api/admin/menu/items', { categoryId, name: 'Moqueca', priceCents: 8000, available: false });
  vinho = await admin('/api/admin/menu/items', { categoryId, name: 'Vinhos', priceCents: null });
});
afterAll(() => ctx.close());

describe('criação de pedido', () => {
  it('calcula o total com os preços do banco, ignorando preço enviado pelo navegador', async () => {
    const response = await order({
      items: [
        { menuItemId: feijoada, quantity: 2, notes: 'sem couve', priceCents: 1 },
        { menuItemId: suco, quantity: 1 },
      ],
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      type: 'pickup',
      status: 'pending',
      itemsSubtotalCents: 2 * 4990 + 1200,
      deliveryFeeCents: 0,
      totalCents: 2 * 4990 + 1200,
      address: null,
      items: [
        { name: 'Feijoada', unitPriceCents: 4990, quantity: 2, notes: 'sem couve' },
        { name: 'Suco', unitPriceCents: 1200, quantity: 1, notes: null },
      ],
    });
    expect(response.json().code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('delivery exige endereço e fica sem total até o restaurante definir a taxa', async () => {
    expect((await order({ type: 'delivery' })).statusCode).toBe(400);

    const response = await order({ type: 'delivery', address });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      deliveryFeeCents: null,
      totalCents: null,
      address: { street: 'Rua das Flores', zipCode: '01001000' },
    });
  });

  it('recusa item esgotado, pedido vazio e troco inválido', async () => {
    expect((await order({ items: [{ menuItemId: esgotado, quantity: 1 }] })).json().error).toBe('ITEM_UNAVAILABLE');
    expect((await order({ items: [] })).statusCode).toBe(400);
    expect((await order({ paymentMethod: 'cash', changeForCents: 2000 })).json().error).toBe('INVALID_CHANGE');
    expect((await order({ paymentMethod: 'card', changeForCents: 10000 })).statusCode).toBe(400);
    expect((await order({ paymentMethod: 'cash', changeForCents: 10000 })).statusCode).toBe(201);
  });

  it('item com preço "Consulte" aparece no cardápio, mas não pode ser pedido online', async () => {
    const menu = await ctx.app.inject({ method: 'GET', url: '/api/menu' });
    const items = menu.json().categories.flatMap((c: { items: unknown[] }) => c.items);
    expect(items).toContainEqual(expect.objectContaining({ id: vinho, priceCents: null }));

    const response = await order({ items: [{ menuItemId: vinho, quantity: 1 }] });
    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe('ITEM_NOT_ORDERABLE');
  });

  it('visitante precisa aceitar a política de privacidade', async () => {
    expect((await order({ acceptPrivacy: undefined })).json().error).toBe('PRIVACY_REQUIRED');
  });

  it('não aceita pedido com o restaurante fechado', async () => {
    ctx.clock.now = new Date('2026-10-05T12:00:00-03:00'); // segunda-feira
    try {
      expect((await order({})).json().error).toBe('RESTAURANT_CLOSED');
    } finally {
      ctx.clock.now = OPEN;
    }
  });
});

describe('acompanhamento pelo cliente', () => {
  it('consulta com código + telefone e cancela enquanto está pendente', async () => {
    const { code } = (await order({})).json();

    expect((await ctx.app.inject({ method: 'GET', url: `/api/orders/${code}?phone=11900000000` })).statusCode).toBe(404);
    const lookup = await ctx.app.inject({ method: 'GET', url: `/api/orders/${code}?phone=11955554444` });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json()).not.toHaveProperty('customerPhone');

    const cancel = await ctx.app.inject({
      method: 'POST',
      url: `/api/orders/${code}/cancel`,
      payload: { phone: customer.phone },
    });
    expect(cancel.json()).toMatchObject({ status: 'cancelled', cancelReason: 'Cancelado pelo cliente' });
  });

  it('não cancela depois que o restaurante confirmou', async () => {
    const { code } = (await order({})).json();
    await setStatus(await staffIdOf(code), { status: 'confirmed' });
    const cancel = await ctx.app.inject({
      method: 'POST',
      url: `/api/orders/${code}/cancel`,
      payload: { phone: customer.phone },
    });
    expect(cancel.statusCode).toBe(409);
  });
});

describe('painel do restaurante', () => {
  it('confirma delivery definindo a taxa e acompanha até a entrega', async () => {
    const { code } = (await order({ type: 'delivery', address })).json();
    const id = await staffIdOf(code);

    const noFee = await setStatus(id, { status: 'confirmed' });
    expect(noFee.json().error).toBe('DELIVERY_FEE_REQUIRED');

    const confirmed = await setStatus(id, { status: 'confirmed', deliveryFeeCents: 800 });
    expect(confirmed.json()).toMatchObject({ status: 'confirmed', deliveryFeeCents: 800, totalCents: 4990 + 800 });

    // Cliente vê o total atualizado.
    const lookup = await ctx.app.inject({ method: 'GET', url: `/api/orders/${code}?phone=${encodeURIComponent(customer.phone)}` });
    expect(lookup.json().totalCents).toBe(5790);

    const out = await setStatus(id, { status: 'out_for_delivery', courierName: 'Carlos' });
    expect(out.json()).toMatchObject({ status: 'out_for_delivery', courierName: 'Carlos' });
    expect((await setStatus(id, { status: 'preparing' })).json().error).toBe('INVALID_TRANSITION');
    expect((await setStatus(id, { status: 'completed' })).json().status).toBe('completed');
    expect((await setStatus(id, { status: 'cancelled', cancelReason: 'teste' })).statusCode).toBe(409);
  });

  it('retirada não sai para entrega nem recebe taxa', async () => {
    const id = await staffIdOf((await order({})).json().code);
    expect((await setStatus(id, { status: 'out_for_delivery' })).statusCode).toBe(409);
    expect((await setStatus(id, { status: 'confirmed', deliveryFeeCents: 500 })).json().error).toBe('NOT_DELIVERY');
  });

  it('cancelar exige motivo, que o cliente consegue ver', async () => {
    const { code } = (await order({})).json();
    const id = await staffIdOf(code);
    expect((await setStatus(id, { status: 'cancelled' })).json().error).toBe('CANCEL_REASON_REQUIRED');
    await setStatus(id, { status: 'cancelled', cancelReason: 'Acabou a feijoada' });
    const lookup = await ctx.app.inject({ method: 'GET', url: `/api/orders/${code}?phone=${encodeURIComponent(customer.phone)}` });
    expect(lookup.json().cancelReason).toBe('Acabou a feijoada');
  });

  it('lista os pedidos em aberto por padrão, com telefone para contato', async () => {
    const list = await ctx.app.inject({ method: 'GET', url: '/api/admin/orders', headers: bearer(staffToken) });
    expect(list.statusCode).toBe(200);
    const statuses = list.json().map((o: { status: string }) => o.status);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses).not.toContain('cancelled');
    expect(statuses).not.toContain('completed');
    expect(list.json()[0].customerPhone).toBe('11955554444');
  });

  it('cliente não acessa o painel', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'xereta@example.com' });
    const list = await ctx.app.inject({ method: 'GET', url: '/api/admin/orders', headers: bearer(accessToken) });
    expect(list.statusCode).toBe(403);
  });

  it('mudar o preço no cardápio não altera pedidos já feitos', async () => {
    const { code } = (await order({})).json();
    await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/menu/items/${feijoada}`,
      headers: bearer(adminToken),
      payload: { priceCents: 5990 },
    });
    const lookup = await ctx.app.inject({ method: 'GET', url: `/api/orders/${code}?phone=${encodeURIComponent(customer.phone)}` });
    expect(lookup.json().items[0].unitPriceCents).toBe(4990);
  });
});

describe('cliente com conta', () => {
  it('vê seus pedidos, exporta e só exclui a conta sem pedido em andamento (LGPD)', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'pedidos@example.com' });
    const created = await order({ type: 'delivery', address, acceptPrivacy: undefined }, bearer(accessToken));
    expect(created.statusCode).toBe(201);
    const { code } = created.json();

    const mine = await ctx.app.inject({ method: 'GET', url: '/api/me/orders', headers: bearer(accessToken) });
    expect(mine.json()).toEqual([expect.objectContaining({ code })]);

    const exported = await ctx.app.inject({ method: 'GET', url: '/api/me/export', headers: bearer(accessToken) });
    expect(exported.json().orders).toEqual([expect.objectContaining({ code })]);

    const id = await staffIdOf(code);
    await setStatus(id, { status: 'confirmed', deliveryFeeCents: 500 });

    const remove = () =>
      ctx.app.inject({
        method: 'DELETE',
        url: '/api/me',
        headers: bearer(accessToken),
        payload: { password: validRegistration.password },
      });
    expect((await remove()).json().error).toBe('ORDER_IN_PROGRESS');

    await setStatus(id, { status: 'completed' });
    expect((await remove()).statusCode).toBe(204);

    const afterDelete = await ctx.app.inject({
      method: 'GET',
      url: `/api/admin/orders/${id}`,
      headers: bearer(staffToken),
    });
    expect(afterDelete.json()).toMatchObject({
      status: 'completed',
      customerName: 'Titular removido',
      customerPhone: '00000000000',
      address: { street: null, city: null },
      totalCents: 5990 + 500, // preço da feijoada mudou no teste anterior
    });
  });
});
