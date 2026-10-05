import { asc, eq } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { diningTables } from '../../db/schema.js';
import { audit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';
import { uuidParam } from '../../lib/validation.js';

const tableBody = z.object({
  label: z.string().trim().min(1).max(30),
  seats: z.number().int().min(1).max(30),
  active: z.boolean().default(true),
});

/** Mesas não são apagadas (têm histórico de reservas); para tirar de uso, desative. */
export const tableRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/tables', { preHandler: app.requireRole('admin', 'staff') }, async () => {
    return app.db.select().from(diningTables).orderBy(asc(diningTables.label));
  });

  app.post('/admin/tables', { preHandler: app.requireRole('admin') }, async (request, reply) => {
    const body = tableBody.parse(request.body);
    const [table] = await app.db.insert(diningTables).values(body).returning();
    await audit(app.db, { actorId: request.user.sub, action: 'create', entity: 'dining_table', entityId: table!.id });
    return reply.status(201).send(table);
  });

  app.patch('/admin/tables/:id', { preHandler: app.requireRole('admin') }, async (request) => {
    const { id } = uuidParam.parse(request.params);
    const body = tableBody.partial().parse(request.body);
    const [table] = await app.db.update(diningTables).set(body).where(eq(diningTables.id, id)).returning();
    if (!table) throw notFound('Mesa não encontrada');
    await audit(app.db, { actorId: request.user.sub, action: 'update', entity: 'dining_table', entityId: id });
    return table;
  });
};
