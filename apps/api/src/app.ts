import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { sql } from 'drizzle-orm';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { defaultRestaurantConfig, type RestaurantConfig } from './config/restaurant.js';
import type { Db } from './db/client.js';
import type { Env } from './env.js';
import { AppError } from './lib/errors.js';
import { authRoutes } from './modules/auth/routes.js';
import { meRoutes } from './modules/me/routes.js';
import { menuRoutes } from './modules/menu/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { reservationRoutes } from './modules/reservations/routes.js';
import { tableRoutes } from './modules/tables/routes.js';
import { registerAuth } from './plugins/auth.js';

export interface AppDeps {
  db: Db;
  env: Env;
  restaurant?: RestaurantConfig;
  /** Relógio injetável para os testes não dependerem da data atual. */
  now?: () => Date;
  /** Limite de requisições por IP. Só os testes desligam. */
  rateLimit?: boolean;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    env: Env;
    restaurant: RestaurantConfig;
    now: () => Date;
  }
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { env } = deps;

  const app = Fastify({
    trustProxy: true,
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.NODE_ENV === 'production' ? 'info' : 'debug',
            // Nunca registrar credenciais ou cookies nos logs.
            redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          },
  });

  app.decorate('db', deps.db);
  app.decorate('env', env);
  app.decorate('restaurant', deps.restaurant ?? defaultRestaurantConfig);
  app.decorate('now', deps.now ?? (() => new Date()));

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  if (deps.rateLimit !== false) await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(cookie);
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: '15m' } });
  registerAuth(app);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.code, message: error.message });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ error: error.code ?? 'REQUEST_ERROR', message: error.message });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'NOT_FOUND', message: 'Rota não encontrada' });
  });

  await app.register(
    async (api) => {
      api.get('/health', async () => {
        await api.db.execute(sql`select 1`);
        return { status: 'ok' };
      });
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(meRoutes, { prefix: '/me' });
      await api.register(menuRoutes);
      await api.register(tableRoutes);
      await api.register(reservationRoutes);
      await api.register(orderRoutes);
    },
    { prefix: '/api' },
  );

  return app;
}
