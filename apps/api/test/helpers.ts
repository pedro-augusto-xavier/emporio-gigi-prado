import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { RestaurantConfig } from '../src/config/restaurant.js';
import type { Db } from '../src/db/client.js';
import { migrationsFolder } from '../src/db/migrate.js';
import * as schema from '../src/db/schema.js';
import { loadEnv } from '../src/env.js';
import { testRestaurantConfig } from './fixtures.js';
import { hashPassword } from '../src/lib/password.js';

export const testEnv = loadEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://unused/in-memory',
  JWT_SECRET: 'test-secret-test-secret-test-secret-123',
});

export interface TestContext {
  app: FastifyInstance;
  db: Db;
  clock: { now: Date };
  close: () => Promise<void>;
}

/** Sobe a API com um Postgres de verdade rodando em memória (PGlite), já com as migrações. */
export async function createTestApp(options: { now?: Date; restaurant?: RestaurantConfig; rateLimit?: boolean } = {}): Promise<TestContext> {
  const client = new PGlite();
  const db: Db = drizzle(client, { schema });
  await migrate(drizzle(client), { migrationsFolder });

  const clock = { now: options.now ?? new Date() };
  const app = await buildApp({
    db,
    env: testEnv,
    restaurant: options.restaurant ?? testRestaurantConfig,
    now: () => clock.now,
    rateLimit: options.rateLimit ?? false,
  });
  await app.ready();

  return {
    app,
    db,
    clock,
    close: async () => {
      await app.close();
      await client.close();
    },
  };
}

export const validRegistration = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '(11) 98765-4321',
  password: 'senha-forte-123',
  acceptTerms: true,
  acceptPrivacy: true,
};

export async function registerUser(app: FastifyInstance, overrides: Partial<typeof validRegistration> = {}) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { ...validRegistration, ...overrides },
  });
  if (response.statusCode !== 201) throw new Error(`register falhou: ${response.body}`);
  return response.json() as { accessToken: string; user: { id: string; email: string } };
}

/** Cria usuário com papel específico direto no banco e devolve o token. */
export async function loginAs(ctx: TestContext, role: schema.UserRole): Promise<string> {
  const email = `${role}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'senha-forte-123';
  await ctx.db.insert(schema.users).values({ name: role, email, passwordHash: await hashPassword(password), role });
  const response = await ctx.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });
  return (response.json() as { accessToken: string }).accessToken;
}

export function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

export function getRefreshCookie(response: { cookies: { name: string; value: string }[] }): string | undefined {
  return response.cookies.find((cookie) => cookie.name === 'gigi_rt')?.value;
}

export async function findUser(db: Db, id: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return user;
}
