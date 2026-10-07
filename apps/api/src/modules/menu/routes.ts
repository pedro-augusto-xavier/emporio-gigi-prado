import { asc, eq } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { menuCategories, menuItems, menuSection } from '../../db/schema.js';
import { audit } from '../../lib/audit.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { uuidParam } from '../../lib/validation.js';

const categoryBody = z.object({
  name: z.string().trim().min(1).max(60),
  section: z.enum(menuSection.enumValues).default('almoco'),
  position: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

const itemBody = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().default(null),
  /** null = "Consulte": aparece no cardápio, mas não entra em pedido online. */
  priceCents: z.number().int().min(0).max(1_000_000).nullable(),
  imageUrl: z.url({ protocol: /^https$/ }).nullable().default(null),
  position: z.number().int().min(0).default(0),
  available: z.boolean().default(true),
});

export const menuRoutes: FastifyPluginAsync = async (app) => {
  /** Cardápio público: só categorias ativas e itens disponíveis. */
  app.get('/menu', async () => {
    const categories = await app.db
      .select({ id: menuCategories.id, name: menuCategories.name, section: menuCategories.section })
      .from(menuCategories)
      .where(eq(menuCategories.active, true))
      .orderBy(asc(menuCategories.position), asc(menuCategories.name));

    const items = await app.db
      .select({
        id: menuItems.id,
        categoryId: menuItems.categoryId,
        name: menuItems.name,
        description: menuItems.description,
        priceCents: menuItems.priceCents,
        imageUrl: menuItems.imageUrl,
      })
      .from(menuItems)
      .where(eq(menuItems.available, true))
      .orderBy(asc(menuItems.position), asc(menuItems.name));

    return {
      categories: categories
        .map((category) => ({ ...category, items: items.filter((item) => item.categoryId === category.id) }))
        .filter((category) => category.items.length > 0),
    };
  });

  // ---- Administração -------------------------------------------------------

  const adminOnly = { preHandler: app.requireRole('admin') };
  // Atendente pode marcar um prato como esgotado durante o expediente.
  const adminOrStaff = { preHandler: app.requireRole('admin', 'staff') };

  app.get('/admin/menu/categories', adminOrStaff, async () => {
    return app.db.select().from(menuCategories).orderBy(asc(menuCategories.position), asc(menuCategories.name));
  });

  app.post('/admin/menu/categories', adminOnly, async (request, reply) => {
    const body = categoryBody.parse(request.body);
    const [category] = await app.db.insert(menuCategories).values(body).returning();
    await audit(app.db, { actorId: request.user.sub, action: 'create', entity: 'menu_category', entityId: category!.id });
    return reply.status(201).send(category);
  });

  app.patch('/admin/menu/categories/:id', adminOnly, async (request) => {
    const { id } = uuidParam.parse(request.params);
    const body = categoryBody.partial().parse(request.body);
    const [category] = await app.db.update(menuCategories).set(body).where(eq(menuCategories.id, id)).returning();
    if (!category) throw notFound('Categoria não encontrada');
    await audit(app.db, { actorId: request.user.sub, action: 'update', entity: 'menu_category', entityId: id });
    return category;
  });

  app.delete('/admin/menu/categories/:id', adminOnly, async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const [item] = await app.db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.categoryId, id)).limit(1);
    if (item) throw conflict('CATEGORY_NOT_EMPTY', 'Remova ou mova os itens desta categoria primeiro');
    const [deleted] = await app.db.delete(menuCategories).where(eq(menuCategories.id, id)).returning();
    if (!deleted) throw notFound('Categoria não encontrada');
    await audit(app.db, { actorId: request.user.sub, action: 'delete', entity: 'menu_category', entityId: id });
    return reply.status(204).send();
  });

  app.get('/admin/menu/items', adminOrStaff, async () => {
    return app.db.select().from(menuItems).orderBy(asc(menuItems.position), asc(menuItems.name));
  });

  async function assertCategoryExists(categoryId: string) {
    const [category] = await app.db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.id, categoryId))
      .limit(1);
    if (!category) throw badRequest('INVALID_CATEGORY', 'Categoria não existe');
  }

  app.post('/admin/menu/items', adminOnly, async (request, reply) => {
    const body = itemBody.parse(request.body);
    await assertCategoryExists(body.categoryId);
    const [item] = await app.db.insert(menuItems).values(body).returning();
    await audit(app.db, { actorId: request.user.sub, action: 'create', entity: 'menu_item', entityId: item!.id });
    return reply.status(201).send(item);
  });

  app.patch('/admin/menu/items/:id', adminOrStaff, async (request) => {
    const { id } = uuidParam.parse(request.params);
    // Atendente só mexe na disponibilidade; o resto é com o admin.
    const schema = request.user.role === 'admin' ? itemBody.partial() : itemBody.pick({ available: true }).strict();
    const body = schema.parse(request.body);
    if ('categoryId' in body && body.categoryId) await assertCategoryExists(body.categoryId);
    const [item] = await app.db.update(menuItems).set(body).where(eq(menuItems.id, id)).returning();
    if (!item) throw notFound('Item não encontrado');
    await audit(app.db, { actorId: request.user.sub, action: 'update', entity: 'menu_item', entityId: id });
    return item;
  });

  app.delete('/admin/menu/items/:id', adminOnly, async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const [deleted] = await app.db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    if (!deleted) throw notFound('Item não encontrado');
    await audit(app.db, { actorId: request.user.sub, action: 'delete', entity: 'menu_item', entityId: id });
    return reply.status(204).send();
  });
};
