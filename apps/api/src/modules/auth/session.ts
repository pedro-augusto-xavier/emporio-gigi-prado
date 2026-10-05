import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { Db } from '../../db/client.js';
import { refreshTokens, users } from '../../db/schema.js';
import { generateRefreshToken, sha256 } from '../../lib/tokens.js';

export const REFRESH_COOKIE = 'gigi_rt';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Versão vigente dos Termos de Uso e da Política de Privacidade. Mudou o texto, mude a versão. */
export const POLICY_VERSION = '2026-10-05';

type UserRow = typeof users.$inferSelect;

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function cookieOptions(app: FastifyInstance) {
  return {
    httpOnly: true,
    secure: app.env.COOKIE_SECURE,
    sameSite: 'strict' as const,
    path: '/api/auth',
  };
}

/** Access token curto (15 min) no corpo + refresh token longo em cookie httpOnly. */
export async function issueSession(app: FastifyInstance, reply: FastifyReply, user: UserRow) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(app.now().getTime() + REFRESH_TTL_MS);
  await app.db.insert(refreshTokens).values({ userId: user.id, tokenHash: sha256(refreshToken), expiresAt });

  reply.setCookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions(app), expires: expiresAt });
  const accessToken = app.jwt.sign({ sub: user.id, role: user.role });
  return { accessToken, user: toPublicUser(user) };
}

export function clearSessionCookie(app: FastifyInstance, reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE, cookieOptions(app));
}

export async function revokeAllSessions(db: Db, userId: string, now: Date): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
