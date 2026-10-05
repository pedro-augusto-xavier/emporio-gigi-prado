import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, getRefreshCookie, registerUser, validRegistration, type TestContext } from './helpers.js';

let ctx: TestContext;
beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(() => ctx.close());

describe('auth', () => {
  it('cadastra cliente, normaliza dados e não expõe o hash da senha', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...validRegistration, email: '  Joana@Example.COM ', phone: '+55 (21) 99999-0000' },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.user).toMatchObject({ email: 'joana@example.com', phone: '21999990000', role: 'customer' });
    expect(body.accessToken).toBeTypeOf('string');
    expect(response.body).not.toContain('passwordHash');

    const cookie = response.cookies.find((c) => c.name === 'gigi_rt');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Strict');
  });

  it('exige aceite dos termos e da política de privacidade (LGPD)', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...validRegistration, email: 'semaceite@example.com', acceptPrivacy: false },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
  });

  it('não deixa cadastrar o mesmo e-mail duas vezes, ignorando maiúsculas', async () => {
    await registerUser(ctx.app, { email: 'dup@example.com' });
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...validRegistration, email: 'DUP@example.com' },
    });
    expect(response.statusCode).toBe(409);
  });

  it('faz login e recusa senha errada com mensagem genérica', async () => {
    await registerUser(ctx.app, { email: 'login@example.com' });

    const ok = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: validRegistration.password },
    });
    expect(ok.statusCode).toBe(200);

    const wrong = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'errada-123' },
    });
    const unknown = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'naoexiste@example.com', password: 'errada-123' },
    });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json().message).toBe(unknown.json().message);
  });

  it('rotaciona o refresh token e derruba as sessões se um token antigo for reutilizado', async () => {
    const register = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...validRegistration, email: 'refresh@example.com' },
    });
    const first = getRefreshCookie(register)!;

    const refreshed = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', cookies: { gigi_rt: first } });
    expect(refreshed.statusCode).toBe(200);
    const second = getRefreshCookie(refreshed)!;
    expect(second).not.toBe(first);

    // Reuso do token antigo (ex.: roubado) -> 401 e o token novo também deixa de valer.
    const reuse = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', cookies: { gigi_rt: first } });
    expect(reuse.statusCode).toBe(401);
    const afterReuse = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', cookies: { gigi_rt: second } });
    expect(afterReuse.statusCode).toBe(401);
  });

  it('logout invalida o refresh token', async () => {
    const register = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...validRegistration, email: 'logout@example.com' },
    });
    const token = getRefreshCookie(register)!;
    const logout = await ctx.app.inject({ method: 'POST', url: '/api/auth/logout', cookies: { gigi_rt: token } });
    expect(logout.statusCode).toBe(204);
    const refresh = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', cookies: { gigi_rt: token } });
    expect(refresh.statusCode).toBe(401);
  });

  it('rotas protegidas exigem token válido', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/api/me' })).statusCode).toBe(401);
    expect((await ctx.app.inject({ method: 'GET', url: '/api/me', headers: bearer('lixo') })).statusCode).toBe(401);
  });

  it('envia cabeçalhos de segurança', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});
