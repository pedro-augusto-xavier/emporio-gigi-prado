import { eq, sql } from 'drizzle-orm';
import { hashPassword } from '../lib/password.js';
import type { Db } from './client.js';
import { openDatabase } from './connect.js';
import { diningTables, menuCategories, menuItems, users } from './schema.js';

/** Dados iniciais: um admin, algumas mesas e um cardápio de exemplo. Pode rodar mais de uma vez. */
export async function seed(db: Db, admin: { email: string; password: string }) {
  const email = admin.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(sql`lower(${users.email})`, email));
  if (!existing) {
    await db.insert(users).values({
      name: 'Administrador',
      email,
      passwordHash: await hashPassword(admin.password),
      role: 'admin',
    });
    console.log(`Admin criado: ${email}`);
  }

  const [anyTable] = await db.select({ id: diningTables.id }).from(diningTables).limit(1);
  if (!anyTable) {
    await db.insert(diningTables).values([
      { label: 'Mesa 01', seats: 2 },
      { label: 'Mesa 02', seats: 2 },
      { label: 'Mesa 03', seats: 4 },
      { label: 'Mesa 04', seats: 4 },
      { label: 'Mesa 05', seats: 4 },
      { label: 'Mesa 06', seats: 6 },
      { label: 'Mesa 07', seats: 8 },
    ]);
    console.log('Mesas de exemplo criadas.');
  }

  const [anyCategory] = await db.select({ id: menuCategories.id }).from(menuCategories).limit(1);
  if (!anyCategory) {
    // Cardápio do Empório Gigi Prado (fotos de 05/10/2026). Os pratos principais ainda faltam.
    const [sugestoes, sobremesas, bebidas] = await db
      .insert(menuCategories)
      .values([
        { name: 'Sugestões do Chef', position: 1 },
        { name: 'Sobremesas', position: 2 },
        { name: 'Bebidas', position: 3 },
      ])
      .returning();
    await db.insert(menuItems).values([
      // Quadro de giz: muda com frequência, a equipe ativa/desativa pelo painel.
      {
        categoryId: sugestoes!.id,
        name: 'Mignon grelhado',
        description: 'Molho mostarda, linguine de alho negro e ervas',
        priceCents: 8900,
      },
      {
        categoryId: sugestoes!.id,
        name: 'Costelinha assada em forno baixo',
        description: 'Creme de baroa e molho com toque oriental',
        priceCents: 8000,
      },
      {
        categoryId: sugestoes!.id,
        name: 'Truta com molho de pinhão',
        description: 'Batatinhas e cogumelos na manteiga de ervas',
        priceCents: 8200,
      },
      { categoryId: sugestoes!.id, name: 'Camarão grelhado', description: 'Açafrão e creme de baroa', priceCents: 8500 },

      { categoryId: sobremesas!.id, name: 'Pudim', priceCents: 1200 },
      {
        categoryId: sobremesas!.id,
        name: 'Torta',
        description: 'Maçãs, damascos, lascas de amêndoas, alemã ou mil-folhas',
        priceCents: 2500,
      },
      { categoryId: sobremesas!.id, name: 'Rabanada da Casa', priceCents: 2800 },
      {
        categoryId: sobremesas!.id,
        name: 'Profiteroles',
        description: 'Tradicional, com sorvete e calda quente de chocolate',
        priceCents: 3000,
      },
      {
        categoryId: sobremesas!.id,
        name: 'Morango Empório',
        description: 'A mesma massa choux, morangos com creme especial e calda de morangos frescos',
        priceCents: 3500,
      },
      { categoryId: sobremesas!.id, name: 'Mousse Três Chocolates', priceCents: 2800 },

      { categoryId: bebidas!.id, name: 'Água Mineral', priceCents: 600 },
      { categoryId: bebidas!.id, name: 'Água Saborizada da Casa', description: 'Copo', priceCents: 700 },
      { categoryId: bebidas!.id, name: 'Expresso pequeno / Americano', priceCents: 900 },
      { categoryId: bebidas!.id, name: 'Expresso duplo', priceCents: 1500 },
      { categoryId: bebidas!.id, name: 'Chás / Mate da Casa', description: 'Quente ou gelado', priceCents: 900 },
      {
        categoryId: bebidas!.id,
        name: 'Sucos',
        description: 'Copo. Laranja, abacaxi, limonada suíça ou morango',
        priceCents: 1500,
      },
      {
        categoryId: bebidas!.id,
        name: 'Sucos Especiais',
        description: 'Copo. Limonada das Neves, Limonada dos Sonhos ou Drink Empório (dois sabores)',
        priceCents: 1900,
      },
      { categoryId: bebidas!.id, name: 'Refrigerantes', description: 'Lata', priceCents: 900 },
      { categoryId: bebidas!.id, name: 'Cerveja Long Neck', description: '330 ml', priceCents: 1500 },
      // Preço "Consulte": aparecem no cardápio, mas não entram em pedido online.
      { categoryId: bebidas!.id, name: 'Caipirinha (frutas)', priceCents: null },
      { categoryId: bebidas!.id, name: 'Vinhos', priceCents: null },
      { categoryId: bebidas!.id, name: 'Cerveja Artesanal', priceCents: null },
    ]);
    console.log('Cardápio do Empório criado.');
  }
}

const isEntrypoint = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');
if (isEntrypoint) {
  const { DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error('Defina DATABASE_URL, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD');
  }
  if (SEED_ADMIN_PASSWORD.length < 12) throw new Error('SEED_ADMIN_PASSWORD precisa ter pelo menos 12 caracteres');
  const { db, close } = await openDatabase(DATABASE_URL, { migrate: false });
  try {
    await seed(db, { email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD });
  } finally {
    await close();
  }
}
