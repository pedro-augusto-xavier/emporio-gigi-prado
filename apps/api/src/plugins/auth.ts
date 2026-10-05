import type { FastifyInstance, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import type { UserRole } from '../db/schema.js';
import { forbidden, unauthorized } from '../lib/errors.js';

export interface AuthUser {
  sub: string;
  role: UserRole;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerAsyncHookHandler;
    requireRole: (...roles: UserRole[]) => preHandlerAsyncHookHandler;
  }
}

async function verify(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw unauthorized('Sessão inválida ou expirada');
  }
}

/** Retorna o usuário se houver token; se não houver, segue como visitante. Token inválido continua sendo erro. */
export async function getOptionalUser(request: FastifyRequest): Promise<AuthUser | null> {
  if (!request.headers.authorization) return null;
  await verify(request);
  return request.user;
}

export function registerAuth(app: FastifyInstance): void {
  app.decorate('authenticate', async (request: FastifyRequest) => {
    await verify(request);
  });

  app.decorate('requireRole', (...roles: UserRole[]) => async (request: FastifyRequest) => {
    await verify(request);
    if (!roles.includes(request.user.role)) throw forbidden();
  });
}
