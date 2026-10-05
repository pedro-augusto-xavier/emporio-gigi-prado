import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, findUser, registerUser, validRegistration, type TestContext } from './helpers.js';

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(() => ctx.close());

describe('direitos do titular (LGPD)', () => {
  it('mostra e corrige os próprios dados', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'corrige@example.com' });

    const me = await ctx.app.inject({ method: 'GET', url: '/api/me', headers: bearer(accessToken) });
    expect(me.json()).toMatchObject({
      user: { email: 'corrige@example.com' },
      consents: { terms: true, privacy: true, marketing: false },
    });

    const patch = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/me',
      headers: bearer(accessToken),
      payload: { name: 'Maria S. Souza', phone: null },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().user).toMatchObject({ name: 'Maria S. Souza', phone: null });
  });

  it('permite dar e revogar consentimento de marketing mantendo o histórico', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'mkt@example.com' });

    const on = await ctx.app.inject({
      method: 'PUT',
      url: '/api/me/consents',
      headers: bearer(accessToken),
      payload: { marketing: true },
    });
    expect(on.json().consents.marketing).toBe(true);

    const off = await ctx.app.inject({
      method: 'PUT',
      url: '/api/me/consents',
      headers: bearer(accessToken),
      payload: { marketing: false },
    });
    expect(off.json().consents.marketing).toBe(false);

    const exported = await ctx.app.inject({ method: 'GET', url: '/api/me/export', headers: bearer(accessToken) });
    const marketingHistory = exported.json().consents.filter((c: { purpose: string }) => c.purpose === 'marketing');
    expect(marketingHistory).toHaveLength(3);
  });

  it('exporta os dados pessoais em JSON', async () => {
    const { accessToken } = await registerUser(ctx.app, { email: 'export@example.com' });
    const response = await ctx.app.inject({ method: 'GET', url: '/api/me/export', headers: bearer(accessToken) });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    const body = response.json();
    expect(body.user.email).toBe('export@example.com');
    expect(JSON.stringify(body)).not.toContain('scrypt$');
  });

  it('exclusão exige senha, anonimiza os dados e impede novo login', async () => {
    const { accessToken, user } = await registerUser(ctx.app, { email: 'apagar@example.com' });

    const wrong = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/me',
      headers: bearer(accessToken),
      payload: { password: 'senha-errada' },
    });
    expect(wrong.statusCode).toBe(401);

    const ok = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/me',
      headers: bearer(accessToken),
      payload: { password: validRegistration.password },
    });
    expect(ok.statusCode).toBe(204);

    const row = await findUser(ctx.db, user.id);
    expect(row?.deletedAt).toBeInstanceOf(Date);
    expect(row?.email).not.toContain('apagar');
    expect(row?.name).toBe('Titular removido');
    expect(row?.phone).toBeNull();

    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'apagar@example.com', password: validRegistration.password },
    });
    expect(login.statusCode).toBe(401);

    // O e-mail fica livre para um novo cadastro.
    await registerUser(ctx.app, { email: 'apagar@example.com' });
  });
});
