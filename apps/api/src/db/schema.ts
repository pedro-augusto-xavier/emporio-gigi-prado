import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------------------
// Usuários e autenticação
// ---------------------------------------------------------------------------

export const userRole = pgEnum('user_role', ['admin', 'staff', 'kitchen', 'courier', 'customer']);
export type UserRole = (typeof userRole.enumValues)[number];

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('customer'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    /** Preenchido quando o titular pede exclusão (LGPD): os dados pessoais são anonimizados. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('users_email_unique').on(sql`lower(${t.email})`)],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Guardamos só o hash SHA-256 do token, nunca o token em si. */
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('refresh_tokens_hash_unique').on(t.tokenHash)],
);

// ---------------------------------------------------------------------------
// LGPD: consentimentos e trilha de auditoria
// ---------------------------------------------------------------------------

export const consentPurpose = pgEnum('consent_purpose', ['terms', 'privacy', 'marketing']);
export type ConsentPurpose = (typeof consentPurpose.enumValues)[number];

/** Histórico imutável: cada mudança de consentimento gera uma nova linha. */
export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: consentPurpose('purpose').notNull(),
    granted: boolean('granted').notNull(),
    policyVersion: text('policy_version').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('consents_user_idx').on(t.userId)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    createdAt: createdAt(),
  },
  (t) => [index('audit_logs_entity_idx').on(t.entity, t.entityId)],
);

// ---------------------------------------------------------------------------
// Cardápio
// ---------------------------------------------------------------------------

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    /**
     * Valores monetários sempre em centavos para evitar erro de arredondamento.
     * Nulo = "Consulte" (ex.: vinhos): aparece no cardápio, mas não pode ser pedido online.
     */
    priceCents: integer('price_cents'),
    imageUrl: text('image_url'),
    available: boolean('available').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('menu_items_category_idx').on(t.categoryId)],
);

// ---------------------------------------------------------------------------
// Mesas e reservas
// ---------------------------------------------------------------------------

export const diningTables = pgTable('dining_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  seats: integer('seats').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reservationStatus = pgEnum('reservation_status', [
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
]);
export type ReservationStatus = (typeof reservationStatus.enumValues)[number];

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Código curto que o cliente usa para consultar/cancelar sem precisar de conta. */
    code: text('code').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    tableId: uuid('table_id')
      .notNull()
      .references(() => diningTables.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    partySize: integer('party_size').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: reservationStatus('status').notNull().default('confirmed'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('reservations_code_unique').on(t.code),
    index('reservations_starts_at_idx').on(t.startsAt),
    index('reservations_user_idx').on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Pedidos (delivery e retirada)
// ---------------------------------------------------------------------------

export const orderType = pgEnum('order_type', ['delivery', 'pickup']);
export type OrderType = (typeof orderType.enumValues)[number];

export const orderStatus = pgEnum('order_status', [
  'pending', // aguardando o restaurante confirmar (e definir a taxa de entrega)
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
]);
export type OrderStatus = (typeof orderStatus.enumValues)[number];

/** Por enquanto o pagamento é feito na entrega/retirada. */
export const paymentMethod = pgEnum('payment_method', ['cash', 'card', 'pix']);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: orderType('type').notNull(),
    status: orderStatus('status').notNull().default('pending'),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    // Endereço copiado no pedido (só para delivery).
    street: text('street'),
    number: text('number'),
    complement: text('complement'),
    district: text('district'),
    city: text('city'),
    zipCode: text('zip_code'),
    reference: text('reference'),
    itemsSubtotalCents: integer('items_subtotal_cents').notNull(),
    /** Nulo enquanto o restaurante não definiu a taxa. Retirada é sempre 0. */
    deliveryFeeCents: integer('delivery_fee_cents'),
    paymentMethod: paymentMethod('payment_method').notNull(),
    changeForCents: integer('change_for_cents'),
    notes: text('notes'),
    courierName: text('courier_name'),
    cancelReason: text('cancel_reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('orders_code_unique').on(t.code),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
    index('orders_user_idx').on(t.userId),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
    /** Nome e preço copiados: se o cardápio mudar, o pedido antigo continua igual. */
    name: text('name').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
    notes: text('notes'),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);
