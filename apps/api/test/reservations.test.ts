import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, loginAs, registerUser, validRegistration, type TestContext } from './helpers.js';

// Relógio fixo: quarta-feira, 07/10/2026, 09:00 em Brasília.
const NOW = new Date('2026-10-07T09:00:00-03:00');

let ctx: TestContext;
let adminToken: string;

const guest = {
  name: 'João Visitante',
  phone: '(11) 91234-5678',
  partySize: 2,
  acceptPrivacy: true,
};

function reserve(payload: Record<string, unknown>, headers: Record<string, string> = {}) {
  return ctx.app.inject({ method: 'POST', url: '/api/reservations', payload: { ...guest, ...payload }, headers });
}

beforeAll(async () => {
  ctx = await createTestApp({ now: NOW });
  adminToken = await loginAs(ctx, 'admin');
});

// O restaurante de teste comporta 6 pessoas ao mesmo tempo e grupos de até 6 (veja fixtures.ts).
afterAll(() => ctx.close());

describe('reservas', () => {
  it('visitante precisa aceitar a política de privacidade', async () => {
    const response = await reserve({ startsAt: '2026-10-08T19:00:00-03:00', acceptPrivacy: undefined });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('PRIVACY_REQUIRED');
  });

  it('recusa horário fora do funcionamento, fora da grade ou no passado', async () => {
    expect((await reserve({ startsAt: '2026-10-12T19:00:00-03:00' })).json().error).toBe('INVALID_SLOT'); // segunda
    expect((await reserve({ startsAt: '2026-10-08T19:10:00-03:00' })).json().error).toBe('INVALID_SLOT');
    expect((await reserve({ startsAt: '2026-10-07T09:30:00-03:00' })).json().error).toBe('INVALID_SLOT');
    expect((await reserve({ startsAt: '2026-10-07T11:00:00-03:00' })).statusCode).toBe(201);
    expect((await reserve({ startsAt: '2026-10-06T19:00:00-03:00' })).json().error).toBe('OUTSIDE_BOOKING_WINDOW');
    const tooLarge = await reserve({ startsAt: '2026-10-08T19:00:00-03:00', partySize: 7 });
    expect(tooLarge.json().error).toBe('PARTY_TOO_LARGE');
    expect(tooLarge.json().message).toMatch(/WhatsApp/);
  });

  it('confirma na hora enquanto cabe gente e avisa quando lota', async () => {
    const startsAt = '2026-10-08T20:00:00-03:00';
    const first = await reserve({ startsAt });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toMatchObject({ status: 'confirmed', partySize: 2 });
    expect(first.json().code).toMatch(/^[A-Z0-9]{8}$/);

    expect((await reserve({ startsAt, partySize: 4 })).statusCode).toBe(201); // 2 + 4 = 6, lotou
    const full = await reserve({ startsAt, partySize: 1 });
    expect(full.statusCode).toBe(409);
    expect(full.json()).toMatchObject({ error: 'NO_AVAILABILITY', message: expect.stringMatching(/lotado/) });

    // 90 minutos depois o salão está livre de novo.
    expect((await reserve({ startsAt: '2026-10-08T21:30:00-03:00' })).statusCode).toBe(201);
  });

  it('mostra a disponibilidade por horário', async () => {
    const response = await ctx.app.inject({
      method: 'GET',
      url: '/api/reservations/availability?date=2026-10-08&partySize=2',
    });
    expect(response.statusCode).toBe(200);
    const slots = response.json().slots as { startsAt: string; available: boolean }[];
    const at = (local: string) => slots.find((s) => s.startsAt === new Date(local).toISOString());
    expect(at('2026-10-08T20:00:00-03:00')?.available).toBe(false);
    expect(at('2026-10-08T12:00:00-03:00')?.available).toBe(true);
  });

  it('não passa da lotação mesmo com várias reservas ao mesmo tempo', async () => {
    const startsAt = '2026-10-09T12:00:00-03:00';
    // 5 grupos de 2 chegando juntos num salão de 6: só 3 cabem.
    const results = await Promise.all(Array.from({ length: 5 }, () => reserve({ startsAt })));
    const statuses = results.map((r) => r.statusCode).sort();
    expect(statuses).toEqual([201, 201, 201, 409, 409]);
  });

  it('consulta e cancela pelo código + telefone, sem conta', async () => {
    const startsAt = '2026-10-10T19:00:00-03:00';
    const { code } = (await reserve({ startsAt, partySize: 4 })).json();

    const wrongPhone = await ctx.app.inject({ method: 'GET', url: `/api/reservations/${code}?phone=11900000000` });
    expect(wrongPhone.statusCode).toBe(404);

    const lookup = await ctx.app.inject({
      method: 'GET',
      url: `/api/reservations/${code.toLowerCase()}?phone=${encodeURIComponent(guest.phone)}`,
    });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json()).not.toHaveProperty('phone');

    // 4 + 4 passa de 6 -> outro grupo de 4 não consegue...
    expect((await reserve({ startsAt, partySize: 4 })).statusCode).toBe(409);

    const cancel = await ctx.app.inject({
      method: 'POST',
      url: `/api/reservations/${code}/cancel`,
      payload: { phone: guest.phone },
    });
    expect(cancel.json().status).toBe('cancelled');

    // ...até a reserva ser cancelada.
    expect((await reserve({ startsAt, partySize: 4 })).statusCode).toBe(201);
    const again = await ctx.app.inject({
      method: 'POST',
      url: `/api/reservations/${code}/cancel`,
      payload: { phone: guest.phone },
    });
    expect(again.statusCode).toBe(409);
  });

  it('cliente logado reserva sem repetir o aceite e vê suas reservas', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'reserva@example.com' });
    const created = await reserve(
      { startsAt: '2026-10-11T12:00:00-03:00', acceptPrivacy: undefined, name: validRegistration.name },
      bearer(accessToken),
    );
    expect(created.statusCode).toBe(201);

    const mine = await ctx.app.inject({ method: 'GET', url: '/api/me/reservations', headers: bearer(accessToken) });
    expect(mine.json()).toEqual([expect.objectContaining({ code: created.json().code })]);
  });

  it('excluir a conta cancela reservas futuras e anonimiza os dados', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'some@example.com' });
    // Domingo, 14:00 (no domingo só abre no almoço).
    const created = await reserve({ startsAt: '2026-10-11T14:00:00-03:00' }, bearer(accessToken));
    expect(created.statusCode).toBe(201);
    const { code } = created.json();

    await ctx.app.inject({
      method: 'DELETE',
      url: '/api/me',
      headers: bearer(accessToken),
      payload: { password: validRegistration.password },
    });

    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/reservations?date=2026-10-11',
      headers: bearer(adminToken),
    });
    const reservation = list.json().find((r: { code: string }) => r.code === code);
    expect(reservation).toMatchObject({ status: 'cancelled', name: 'Titular removido', email: null });
  });

  it('painel lista as reservas do dia, e só para a equipe', async () => {
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/reservations?date=2026-10-08',
      headers: bearer(adminToken),
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(3);
    // Mesa é escolhida na hora pela equipe, então a reserva chega sem mesa.
    expect(list.json()[0].table).toBeNull();

    const { accessToken } = await registerUser(ctx.app, { email: 'curioso@example.com' });
    const denied = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/reservations?date=2026-10-08',
      headers: bearer(accessToken),
    });
    expect(denied.statusCode).toBe(403);
  });

  it('equipe muda o status da reserva', async () => {
    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/admin/reservations?date=2026-10-08',
      headers: bearer(adminToken),
    });
    const [first] = list.json();
    const response = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/admin/reservations/${first.id}/status`,
      headers: bearer(adminToken),
      payload: { status: 'seated' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('seated');
  });
});
