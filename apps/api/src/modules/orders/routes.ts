import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Db } from '../../db/client.js';
import {
  menuCategories,
  menuItems,
  orderItems,
  orders,
  orderStatus,
  orderType,
  paymentMethod,
} from '../../db/schema.js';
import { audit } from '../../lib/audit.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { generateCode } from '../../lib/tokens.js';
import { nameSchema, phoneSchema, uuidParam } from '../../lib/validation.js';
import { getOptionalUser } from '../../plugins/auth.js';
import { localToUtc } from '../reservations/availability.js';
import { IN_PROGRESS_STATUSES, canTransition, isOpenAt, orderTotalCents } from './rules.js';

const optionalText = (max: number) => z.string().trim().max(max).optional();

const addressSchema = z.object({
  street: z.string().trim().min(2).max(120),
  number: z.string().trim().min(1).max(20),
  complement: optionalText(60),
  district: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  zipCode: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'CEP inválido'))
    .optional(),
  reference: optionalText(120),
});

const createBody = z
  .object({
    type: z.enum(orderType.enumValues),
    name: nameSchema,
    phone: phoneSchema,
    address: addressSchema.optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.uuid(),
          quantity: z.number().int().min(1).max(50),
          notes: optionalText(200),
        }),
      )
      .min(1, 'O pedido está vazio')
      .max(50),
    paymentMethod: z.enum(paymentMethod.enumValues),
    /** "Troco para quanto?" (só dinheiro). */
    changeForCents: z.number().int().positive().max(1_000_000).optional(),
    notes: optionalText(500),
    acceptPrivacy: z.boolean().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.type === 'delivery' && !body.address) {
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Informe o endereço de entrega' });
    }
    if (body.changeForCents !== undefined && body.paymentMethod !== 'cash') {
      ctx.addIssue({ code: 'custom', path: ['changeForCents'], message: 'Troco só para pagamento em dinheiro' });
    }
  });

const statusBody = z.object({
  status: z.enum(orderStatus.enumValues),
  deliveryFeeCents: z.number().int().min(0).max(100_000).optional(),
  courierName: z.string().trim().min(1).max(60).optional(),
  cancelReason: z.string().trim().min(3).max(200).optional(),
});

const ACTIVE_STATUSES = ['pending', ...IN_PROGRESS_STATUSES] as const;

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

export async function loadOrderItems(db: Db, orderIds: string[]): Promise<Map<string, OrderItemRow[]>> {
  const grouped = new Map<string, OrderItemRow[]>();
  if (orderIds.length === 0) return grouped;
  const rows = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  for (const row of rows) grouped.set(row.orderId, [...(grouped.get(row.orderId) ?? []), row]);
  return grouped;
}

export function toCustomerOrder(order: OrderRow, items: OrderItemRow[]) {
  return {
    code: order.code,
    type: order.type,
    status: order.status,
    customerName: order.customerName,
    address:
      order.type === 'delivery'
        ? {
            street: order.street,
            number: order.number,
            complement: order.complement,
            district: order.district,
            city: order.city,
            zipCode: order.zipCode,
            reference: order.reference,
          }
        : null,
    items: items.map(({ name, unitPriceCents, quantity, notes }) => ({ name, unitPriceCents, quantity, notes })),
    itemsSubtotalCents: order.itemsSubtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: orderTotalCents(order),
    paymentMethod: order.paymentMethod,
    changeForCents: order.changeForCents,
    notes: order.notes,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
  };
}

function toStaffOrder(order: OrderRow, items: OrderItemRow[]) {
  return {
    id: order.id,
    ...toCustomerOrder(order, items),
    customerPhone: order.customerPhone,
    courierName: order.courierName,
    updatedAt: order.updatedAt,
  };
}

export const orderRoutes: FastifyPluginAsync = async (app) => {
  const config = app.restaurant;
  const publicRateLimit = { rateLimit: { max: 20, timeWindow: '1 minute' } };

  /** Qualquer pessoa pode pedir, com ou sem conta. */
  app.post('/orders', { config: publicRateLimit }, async (request, reply) => {
    const body = createBody.parse(request.body);
    const user = await getOptionalUser(request);

    if (!user && body.acceptPrivacy !== true) {
      throw badRequest('PRIVACY_REQUIRED', 'É preciso aceitar a Política de Privacidade para fazer o pedido');
    }
    if (!isOpenAt(app.now(), config)) {
      throw conflict('RESTAURANT_CLOSED', 'O restaurante está fechado agora. Confira o horário de funcionamento');
    }

    // Preço sempre vem do banco: nunca confiar em valores enviados pelo navegador.
    const ids = [...new Set(body.items.map((item) => item.menuItemId))];
    const available = await app.db
      .select({ id: menuItems.id, name: menuItems.name, priceCents: menuItems.priceCents })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
      .where(and(inArray(menuItems.id, ids), eq(menuItems.available, true), eq(menuCategories.active, true)));
    if (available.length !== ids.length) {
      throw conflict('ITEM_UNAVAILABLE', 'Algum item do pedido não está mais disponível. Atualize o cardápio');
    }
    const byId = new Map<string, { id: string; name: string; priceCents: number }>();
    for (const item of available) {
      if (item.priceCents === null) {
        throw conflict('ITEM_NOT_ORDERABLE', `"${item.name}" não pode ser pedido online. Consulte o restaurante`);
      }
      byId.set(item.id, { ...item, priceCents: item.priceCents });
    }

    const lines = body.items.map((item) => {
      const menuItem = byId.get(item.menuItemId)!;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPriceCents: menuItem.priceCents,
        quantity: item.quantity,
        notes: item.notes ?? null,
      };
    });
    const itemsSubtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);

    if (body.changeForCents !== undefined && body.changeForCents < itemsSubtotalCents) {
      throw badRequest('INVALID_CHANGE', 'O valor para troco é menor que o total do pedido');
    }

    const address = body.type === 'delivery' ? body.address! : undefined;
    const { order, items } = await app.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          code: generateCode(),
          userId: user?.sub ?? null,
          type: body.type,
          customerName: body.name,
          customerPhone: body.phone,
          street: address?.street ?? null,
          number: address?.number ?? null,
          complement: address?.complement ?? null,
          district: address?.district ?? null,
          city: address?.city ?? null,
          zipCode: address?.zipCode ?? null,
          reference: address?.reference ?? null,
          itemsSubtotalCents,
          // Retirada não tem taxa; na entrega o restaurante define ao confirmar.
          deliveryFeeCents: body.type === 'pickup' ? 0 : null,
          paymentMethod: body.paymentMethod,
          changeForCents: body.changeForCents ?? null,
          notes: body.notes ?? null,
          createdAt: app.now(),
        })
        .returning();
      const items = await tx
        .insert(orderItems)
        .values(lines.map((line) => ({ ...line, orderId: order!.id })))
        .returning();
      return { order: order!, items };
    });

    return reply.status(201).send(toCustomerOrder(order, items));
  });

  // Acompanhamento sem conta: código + telefone.
  async function findByCodeAndPhone(rawCode: unknown, rawPhone: unknown) {
    const code = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/, 'Código inválido').parse(rawCode);
    const phone = phoneSchema.parse(rawPhone);
    const [order] = await app.db
      .select()
      .from(orders)
      .where(and(eq(orders.code, code), eq(orders.customerPhone, phone)))
      .limit(1);
    if (!order) throw notFound('Pedido não encontrado');
    return order;
  }

  app.get('/orders/:code', { config: publicRateLimit }, async (request) => {
    const { code } = request.params as { code: string };
    const { phone } = (request.query ?? {}) as { phone?: string };
    const order = await findByCodeAndPhone(code, phone);
    const items = await loadOrderItems(app.db, [order.id]);
    return toCustomerOrder(order, items.get(order.id) ?? []);
  });

  /** O cliente só cancela enquanto o restaurante não confirmou. Depois disso, só ligando. */
  app.post('/orders/:code/cancel', { config: publicRateLimit }, async (request) => {
    const { code } = request.params as { code: string };
    const { phone } = (request.body ?? {}) as { phone?: string };
    const order = await findByCodeAndPhone(code, phone);

    const [updated] = await app.db
      .update(orders)
      .set({ status: 'cancelled', cancelReason: 'Cancelado pelo cliente' })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
      .returning();
    if (!updated) {
      throw conflict('CANNOT_CANCEL', 'O pedido já foi confirmado. Para cancelar, ligue para o restaurante');
    }
    const items = await loadOrderItems(app.db, [order.id]);
    return toCustomerOrder(updated, items.get(order.id) ?? []);
  });

  app.get('/me/orders', { preHandler: app.authenticate }, async (request) => {
    const rows = await app.db
      .select()
      .from(orders)
      .where(eq(orders.userId, request.user.sub))
      .orderBy(desc(orders.createdAt))
      .limit(50);
    const items = await loadOrderItems(app.db, rows.map((row) => row.id));
    return rows.map((row) => toCustomerOrder(row, items.get(row.id) ?? []));
  });

  // ---- Painel do restaurante -------------------------------------------------

  const staff = { preHandler: app.requireRole('admin', 'staff') };

  /** Sem filtro: pedidos em aberto. Com `date`: todos os pedidos daquele dia. */
  app.get('/admin/orders', staff, async (request) => {
    const query = z
      .object({
        date: z.iso.date().optional(),
        status: z.enum(orderStatus.enumValues).optional(),
      })
      .parse(request.query);

    const filters = [];
    if (query.date) {
      const dayStart = localToUtc(query.date, '00:00', config);
      filters.push(gte(orders.createdAt, dayStart), lt(orders.createdAt, new Date(dayStart.getTime() + 86_400_000)));
    }
    if (query.status) filters.push(eq(orders.status, query.status));
    if (!query.date && !query.status) filters.push(inArray(orders.status, [...ACTIVE_STATUSES]));

    const rows = await app.db
      .select()
      .from(orders)
      .where(and(...filters))
      .orderBy(desc(orders.createdAt))
      .limit(200);
    const items = await loadOrderItems(app.db, rows.map((row) => row.id));
    return rows.map((row) => toStaffOrder(row, items.get(row.id) ?? []));
  });

  app.get('/admin/orders/:id', staff, async (request) => {
    const { id } = uuidParam.parse(request.params);
    const [order] = await app.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw notFound('Pedido não encontrado');
    const items = await loadOrderItems(app.db, [id]);
    return toStaffOrder(order, items.get(id) ?? []);
  });

  app.patch('/admin/orders/:id/status', staff, async (request) => {
    const { id } = uuidParam.parse(request.params);
    const body = statusBody.parse(request.body);

    const updated = await app.db.transaction(async (tx) => {
      // FOR UPDATE: duas pessoas mexendo no mesmo pedido não se atropelam.
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for('update');
      if (!order) throw notFound('Pedido não encontrado');

      if (!canTransition(order.type, order.status, body.status)) {
        throw conflict('INVALID_TRANSITION', `Não é possível mudar de "${order.status}" para "${body.status}"`);
      }
      if (body.deliveryFeeCents !== undefined && order.type !== 'delivery') {
        throw badRequest('NOT_DELIVERY', 'Pedido de retirada não tem taxa de entrega');
      }
      if (body.courierName !== undefined && order.type !== 'delivery') {
        throw badRequest('NOT_DELIVERY', 'Pedido de retirada não tem entregador');
      }

      const deliveryFeeCents = body.deliveryFeeCents ?? order.deliveryFeeCents;
      if (body.status !== 'cancelled' && deliveryFeeCents === null) {
        throw badRequest('DELIVERY_FEE_REQUIRED', 'Informe a taxa de entrega para confirmar o pedido');
      }
      if (body.status === 'cancelled' && !body.cancelReason) {
        throw badRequest('CANCEL_REASON_REQUIRED', 'Informe o motivo do cancelamento (o cliente vai ver)');
      }

      const [row] = await tx
        .update(orders)
        .set({
          status: body.status,
          deliveryFeeCents,
          courierName: body.courierName ?? order.courierName,
          cancelReason: body.status === 'cancelled' ? body.cancelReason : order.cancelReason,
        })
        .where(eq(orders.id, id))
        .returning();
      await audit(tx, { actorId: request.user.sub, action: `status:${body.status}`, entity: 'order', entityId: id });
      return row!;
    });

    const items = await loadOrderItems(app.db, [id]);
    return toStaffOrder(updated, items.get(id) ?? []);
  });
};

