import { and, eq, isNull, sql } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { consents, refreshTokens, users } from '../../db/schema.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import { getDummyHash, hashPassword, verifyPassword } from '../../lib/password.js';
import { sha256 } from '../../lib/tokens.js';
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from '../../lib/validation.js';
import { POLICY_VERSION, REFRESH_COOKIE, clearSessionCookie, issueSession, revokeAllSessions } from './session.js';

const registerBody = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  // LGPD: o consentimento precisa ser livre, informado e inequívoco. Nada de caixa pré-marcada no front.
  acceptTerms: z.literal(true, { error: 'É preciso aceitar os Termos de Uso' }),
  acceptPrivacy: z.literal(true, { error: 'É preciso aceitar a Política de Privacidade' }),
  marketingOptIn: z.boolean().default(false),
});

const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

// Limite mais rígido nas rotas de credenciais contra força bruta.
const strictRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } };

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', { config: strictRateLimit }, async (request, reply) => {
    const body = registerBody.parse(request.body);

    const [existing] = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.email})`, body.email))
      .limit(1);
    if (existing) throw conflict('EMAIL_IN_USE', 'Este e-mail já está cadastrado');

    const passwordHash = await hashPassword(body.password);
    const user = await app.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ name: body.name, email: body.email, phone: body.phone ?? null, passwordHash })
        .returning();
      await tx.insert(consents).values([
        { userId: created!.id, purpose: 'terms', granted: true, policyVersion: POLICY_VERSION },
        { userId: created!.id, purpose: 'privacy', granted: true, policyVersion: POLICY_VERSION },
        { userId: created!.id, purpose: 'marketing', granted: body.marketingOptIn, policyVersion: POLICY_VERSION },
      ]);
      return created!;
    });

    const session = await issueSession(app, reply, user);
    return reply.status(201).send(session);
  });

  app.post('/login', { config: strictRateLimit }, async (request, reply) => {
    const body = loginBody.parse(request.body);

    const [user] = await app.db
      .select()
      .from(users)
      .where(and(eq(sql`lower(${users.email})`, body.email), isNull(users.deletedAt)))
      .limit(1);

    // Mesmo sem usuário, roda o hash para o tempo de resposta não revelar se o e-mail existe.
    const valid = await verifyPassword(body.password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !valid) throw unauthorized('E-mail ou senha incorretos');

    return issueSession(app, reply, user);
  });

  app.post('/refresh', { config: strictRateLimit }, async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (!token) throw unauthorized('Sessão expirada');

    const now = app.now();
    const [row] = await app.db
      .select({ token: refreshTokens, user: users })
      .from(refreshTokens)
      .innerJoin(users, eq(users.id, refreshTokens.userId))
      .where(eq(refreshTokens.tokenHash, sha256(token)))
      .limit(1);

    if (!row) {
      clearSessionCookie(app, reply);
      throw unauthorized('Sessão expirada');
    }

    // Token já usado sendo reapresentado = provável roubo. Derruba todas as sessões do usuário.
    if (row.token.revokedAt) {
      await revokeAllSessions(app.db, row.user.id, now);
      clearSessionCookie(app, reply);
      throw unauthorized('Sessão expirada');
    }

    if (row.token.expiresAt <= now || row.user.deletedAt) {
      clearSessionCookie(app, reply);
      throw unauthorized('Sessão expirada');
    }

    // Rotação: cada refresh token só vale uma vez.
    await app.db.update(refreshTokens).set({ revokedAt: now }).where(eq(refreshTokens.id, row.token.id));
    return issueSession(app, reply, row.user);
  });

  app.post('/logout', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (token) {
      await app.db
        .update(refreshTokens)
        .set({ revokedAt: app.now() })
        .where(and(eq(refreshTokens.tokenHash, sha256(token)), isNull(refreshTokens.revokedAt)));
    }
    clearSessionCookie(app, reply);
    return reply.status(204).send();
  });
};
