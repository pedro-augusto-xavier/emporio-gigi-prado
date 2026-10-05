import { and, asc, desc, eq, gt, gte, inArray, lt, sql } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Db } from '../../db/client.js';
import { diningTables, reservations, reservationStatus } from '../../db/schema.js';
import { audit } from '../../lib/audit.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { generateCode } from '../../lib/tokens.js';
import { emailSchema, nameSchema, phoneSchema, uuidParam } from '../../lib/validation.js';
import { getOptionalUser } from '../../plugins/auth.js';
import {
  generateSlots,
  isSlotStart,
  isWithinBookingWindow,
  localDateOf,
  localToUtc,
  pickTable,
  reservationEnd,
  type BookedInterval,
} from './availability.js';

/** Status que ocupam a mesa. */
const BLOCKING_STATUSES = ['confirmed', 'seated'] as const;

const dateSchema = z.iso.date('Data inválida, use AAAA-MM-DD');
const codeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/, 'Código inválido');

const createBody = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  partySize: z.number().int().min(1),
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  notes: z.string().trim().max(500).optional(),
  acceptPrivacy: z.boolean().optional(),
});

type ReservationRow = typeof reservations.$inferSelect;

function toPublicReservation(r: ReservationRow) {
  return {
    code: r.code,
    name: r.name,
    partySize: r.partySize,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    status: r.status,
    notes: r.notes,
  };
}

async function loadCapacity(db: Db, from: Date, to: Date) {
  const tables = await db
    .select({ id: diningTables.id, label: diningTables.label, seats: diningTables.seats })
    .from(diningTables)
    .where(eq(diningTables.active, true));
  const booked: BookedInterval[] = await db
    .select({ tableId: reservations.tableId, startsAt: reservations.startsAt, endsAt: reservations.endsAt })
    .from(reservations)
    .where(
      and(
        inArray(reservations.status, [...BLOCKING_STATUSES]),
        lt(reservations.startsAt, to),
        gt(reservations.endsAt, from),
      ),
    );
  return { tables, booked };
}

export const reservationRoutes: FastifyPluginAsync = async (app) => {
  const config = app.restaurant;
  const lookupRateLimit = { rateLimit: { max: 20, timeWindow: '1 minute' } };

  app.get('/reservations/availability', async (request) => {
    const query = z
      .object({
        date: dateSchema,
        partySize: z.coerce.number().int().min(1).max(config.maxPartySize),
      })
      .parse(request.query);

    const now = app.now();
    const dayStart = localToUtc(query.date, '00:00', config);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const { tables, booked } = await loadCapacity(app.db, dayStart, dayEnd);

    const slots = generateSlots(query.date, config)
      .filter((slot) => isWithinBookingWindow(slot, now, config))
      .map((slot) => ({
        startsAt: slot.toISOString(),
        available: pickTable(tables, query.partySize, slot, reservationEnd(slot, config), booked) !== null,
      }));

    return { date: query.date, partySize: query.partySize, slots };
  });

  /** Qualquer pessoa pode reservar, com ou sem conta. */
  app.post('/reservations', { config: lookupRateLimit }, async (request, reply) => {
    const body = createBody.parse(request.body);
    const user = await getOptionalUser(request);

    // Quem já tem conta aceitou a política no cadastro; visitante precisa aceitar agora.
    if (!user && body.acceptPrivacy !== true) {
      throw badRequest('PRIVACY_REQUIRED', 'É preciso aceitar a Política de Privacidade para reservar');
    }
    if (body.partySize > config.maxPartySize) {
      throw badRequest(
        'PARTY_TOO_LARGE',
        `Para grupos com mais de ${config.maxPartySize} pessoas, fale com o restaurante por telefone`,
      );
    }
    if (!isSlotStart(body.startsAt, config)) {
      throw badRequest('INVALID_SLOT', 'Horário fora do funcionamento ou fora da grade de horários');
    }
    if (!isWithinBookingWindow(body.startsAt, app.now(), config)) {
      throw badRequest(
        'OUTSIDE_BOOKING_WINDOW',
        `Reservas com no mínimo ${config.minAdvanceMinutes} minutos e no máximo ${config.maxAdvanceDays} dias de antecedência`,
      );
    }

    const startsAt = body.startsAt;
    const endsAt = reservationEnd(startsAt, config);

    const reservation = await app.db.transaction(async (tx) => {
      // Trava por dia: duas reservas simultâneas não conseguem pegar a mesma mesa.
      const lockKey = `reservations:${localDateOf(startsAt, config)}`;
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);

      const { tables, booked } = await loadCapacity(tx, startsAt, endsAt);
      const table = pickTable(tables, body.partySize, startsAt, endsAt, booked);
      if (!table) throw conflict('NO_AVAILABILITY', 'Não há mesa disponível nesse horário');

      const [created] = await tx
        .insert(reservations)
        .values({
          code: generateCode(),
          userId: user?.sub ?? null,
          tableId: table.id,
          name: body.name,
          phone: body.phone,
          email: body.email ?? null,
          partySize: body.partySize,
          startsAt,
          endsAt,
          notes: body.notes ?? null,
        })
        .returning();
      return created!;
    });

    return reply.status(201).send(toPublicReservation(reservation));
  });

  // Consulta/cancelamento sem conta: exige código + telefone, para ninguém ver a reserva alheia.
  async function findByCodeAndPhone(rawCode: unknown, rawPhone: unknown) {
    const code = codeSchema.parse(rawCode);
    const phone = phoneSchema.parse(rawPhone);
    const [reservation] = await app.db
      .select()
      .from(reservations)
      .where(and(eq(reservations.code, code), eq(reservations.phone, phone)))
      .limit(1);
    if (!reservation) throw notFound('Reserva não encontrada');
    return reservation;
  }

  app.get('/reservations/:code', { config: lookupRateLimit }, async (request) => {
    const { code } = request.params as { code: string };
    const { phone } = (request.query ?? {}) as { phone?: string };
    return toPublicReservation(await findByCodeAndPhone(code, phone));
  });

  app.post('/reservations/:code/cancel', { config: lookupRateLimit }, async (request) => {
    const { code } = request.params as { code: string };
    const { phone } = (request.body ?? {}) as { phone?: string };
    const reservation = await findByCodeAndPhone(code, phone);

    if (reservation.status !== 'confirmed' || reservation.startsAt <= app.now()) {
      throw conflict('CANNOT_CANCEL', 'Esta reserva não pode mais ser cancelada');
    }
    const [updated] = await app.db
      .update(reservations)
      .set({ status: 'cancelled' })
      .where(eq(reservations.id, reservation.id))
      .returning();
    return toPublicReservation(updated!);
  });

  app.get('/me/reservations', { preHandler: app.authenticate }, async (request) => {
    const rows = await app.db
      .select()
      .from(reservations)
      .where(eq(reservations.userId, request.user.sub))
      .orderBy(desc(reservations.startsAt));
    return rows.map(toPublicReservation);
  });

  // ---- Painel do restaurante -------------------------------------------------

  const staff = { preHandler: app.requireRole('admin', 'staff') };

  app.get('/admin/reservations', staff, async (request) => {
    const { date } = z.object({ date: dateSchema }).parse(request.query);
    const dayStart = localToUtc(date, '00:00', config);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    return app.db
      .select({
        id: reservations.id,
        code: reservations.code,
        name: reservations.name,
        phone: reservations.phone,
        email: reservations.email,
        partySize: reservations.partySize,
        startsAt: reservations.startsAt,
        endsAt: reservations.endsAt,
        status: reservations.status,
        notes: reservations.notes,
        table: { id: diningTables.id, label: diningTables.label },
      })
      .from(reservations)
      .innerJoin(diningTables, eq(diningTables.id, reservations.tableId))
      .where(and(gte(reservations.startsAt, dayStart), lt(reservations.startsAt, dayEnd)))
      .orderBy(asc(reservations.startsAt));
  });

  app.patch('/admin/reservations/:id/status', staff, async (request) => {
    const { id } = uuidParam.parse(request.params);
    const { status } = z.object({ status: z.enum(reservationStatus.enumValues) }).parse(request.body);
    const [updated] = await app.db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    if (!updated) throw notFound('Reserva não encontrada');
    await audit(app.db, { actorId: request.user.sub, action: `status:${status}`, entity: 'reservation', entityId: id });
    return { id: updated.id, ...toPublicReservation(updated) };
  });
};
