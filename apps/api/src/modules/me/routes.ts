import { and, desc, eq, gt, inArray } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { consents, orders, reservations, users, type ConsentPurpose } from '../../db/schema.js';
import { audit } from '../../lib/audit.js';
import { conflict, notFound, unauthorized } from '../../lib/errors.js';
import { verifyPassword } from '../../lib/password.js';
import { nameSchema, phoneSchema } from '../../lib/validation.js';
import { POLICY_VERSION, clearSessionCookie, revokeAllSessions, toPublicUser } from '../auth/session.js';
import { loadOrderItems, toCustomerOrder } from '../orders/routes.js';
import { IN_PROGRESS_STATUSES } from '../orders/rules.js';

const updateBody = z
  .object({ name: nameSchema.optional(), phone: phoneSchema.nullable().optional() })
  .refine((body) => body.name !== undefined || body.phone !== undefined, 'Nada para atualizar');

const consentsBody = z.object({ marketing: z.boolean() });

const deleteBody = z.object({ password: z.string().min(1).max(128) });

/**
 * Rotas do titular dos dados (LGPD, art. 18): acesso, correção, portabilidade,
 * revogação de consentimento e eliminação.
 */
export const meRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  async function loadUser(id: string) {
    const [user] = await app.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user || user.deletedAt) throw notFound('Usuário não encontrado');
    return user;
  }

  async function currentConsents(userId: string) {
    const history = await app.db
      .select()
      .from(consents)
      .where(eq(consents.userId, userId))
      .orderBy(desc(consents.createdAt), desc(consents.id));
    const latest = {} as Partial<Record<ConsentPurpose, boolean>>;
    for (const entry of history) latest[entry.purpose] ??= entry.granted;
    return { history, latest };
  }

  app.get('/', async (request) => {
    const user = await loadUser(request.user.sub);
    const { latest } = await currentConsents(user.id);
    return { user: toPublicUser(user), consents: latest };
  });

  app.patch('/', async (request) => {
    const body = updateBody.parse(request.body);
    await loadUser(request.user.sub);
    const [user] = await app.db
      .update(users)
      .set({ name: body.name, phone: body.phone })
      .where(eq(users.id, request.user.sub))
      .returning();
    return { user: toPublicUser(user!) };
  });

  app.put('/consents', async (request) => {
    const body = consentsBody.parse(request.body);
    await loadUser(request.user.sub);
    await app.db
      .insert(consents)
      .values({ userId: request.user.sub, purpose: 'marketing', granted: body.marketing, policyVersion: POLICY_VERSION });
    const { latest } = await currentConsents(request.user.sub);
    return { consents: latest };
  });

  /** Portabilidade: todos os dados pessoais do titular em JSON. */
  app.get('/export', async (request, reply) => {
    const user = await loadUser(request.user.sub);
    const { history } = await currentConsents(user.id);
    const userReservations = await app.db
      .select({
        code: reservations.code,
        name: reservations.name,
        phone: reservations.phone,
        email: reservations.email,
        partySize: reservations.partySize,
        startsAt: reservations.startsAt,
        status: reservations.status,
        notes: reservations.notes,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .where(eq(reservations.userId, user.id))
      .orderBy(desc(reservations.startsAt));
    const userOrders = await app.db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));
    const orderItemsById = await loadOrderItems(app.db, userOrders.map((order) => order.id));

    await audit(app.db, { actorId: user.id, action: 'lgpd.export', entity: 'user', entityId: user.id });

    reply.header('Content-Disposition', 'attachment; filename="meus-dados.json"');
    return {
      exportedAt: app.now().toISOString(),
      user: toPublicUser(user),
      consents: history.map(({ purpose, granted, policyVersion, createdAt }) => ({
        purpose,
        granted,
        policyVersion,
        createdAt,
      })),
      reservations: userReservations,
      orders: userOrders.map((order) => toCustomerOrder(order, orderItemsById.get(order.id) ?? [])),
    };
  });

  /**
   * Eliminação: anonimiza em vez de apagar a linha, para não quebrar o histórico
   * (reservas e pedidos, que também servem de registro de vendas).
   */
  app.delete('/', async (request, reply) => {
    const body = deleteBody.parse(request.body);
    const user = await loadUser(request.user.sub);
    if (!(await verifyPassword(body.password, user.passwordHash))) throw unauthorized('Senha incorreta');

    // Pedido já aceito precisa do endereço e telefone até ser entregue.
    const [inProgress] = await app.db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, user.id), inArray(orders.status, [...IN_PROGRESS_STATUSES])))
      .limit(1);
    if (inProgress) {
      throw conflict('ORDER_IN_PROGRESS', 'Você tem um pedido em andamento. Tente de novo depois que ele for entregue');
    }

    const now = app.now();
    await app.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: 'Titular removido',
          email: `removido+${user.id}@anonimo.invalid`,
          phone: null,
          passwordHash: '!',
          deletedAt: now,
        })
        .where(eq(users.id, user.id));

      await tx
        .update(reservations)
        .set({ status: 'cancelled' })
        .where(
          and(
            eq(reservations.userId, user.id),
            gt(reservations.startsAt, now),
            inArray(reservations.status, ['confirmed']),
          ),
        );
      await tx
        .update(reservations)
        .set({ name: 'Titular removido', phone: '00000000000', email: null, notes: null })
        .where(eq(reservations.userId, user.id));

      await tx
        .update(orders)
        .set({ status: 'cancelled', cancelReason: 'Conta excluída pelo titular' })
        .where(and(eq(orders.userId, user.id), eq(orders.status, 'pending')));
      await tx
        .update(orders)
        .set({
          customerName: 'Titular removido',
          customerPhone: '00000000000',
          street: null,
          number: null,
          complement: null,
          district: null,
          city: null,
          zipCode: null,
          reference: null,
          notes: null,
        })
        .where(eq(orders.userId, user.id));

      await revokeAllSessions(tx, user.id, now);
      await audit(tx, { actorId: user.id, action: 'lgpd.delete', entity: 'user', entityId: user.id });
    });

    clearSessionCookie(app, reply);
    return reply.status(204).send();
  });
};
