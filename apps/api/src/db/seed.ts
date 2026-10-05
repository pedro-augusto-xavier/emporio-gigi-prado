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
    // Cardápio do Empório Gigi Prado (fotos de 05/10/2026), na ordem do cardápio impresso.
    const [sugestoes, entradas, peixes, carnes, rosti, vegetariano, infantil, massas, sobremesas, bebidas] = await db
      .insert(menuCategories)
      .values([
        { name: 'Sugestões do Chef', position: 1 },
        { name: 'Entradas', position: 2 },
        { name: 'Peixes', position: 3 },
        { name: 'Carnes', position: 4 },
        { name: 'Rosti', position: 5 },
        { name: 'Vegetariano', position: 6 },
        { name: 'Infantil', position: 7 },
        { name: 'Massas Empório', position: 8 },
        { name: 'Sobremesas', position: 9 },
        { name: 'Bebidas', position: 10 },
      ])
      .returning();
    await db.insert(menuItems).values([
      {
        categoryId: entradas!.id,
        name: 'Entradinha da Casa',
        description: 'Pães, manteiga, geleia especial, pastas, patês e vinagretes. Consulte as opções do dia',
        priceCents: 3200,
      },
      { categoryId: entradas!.id, name: 'Bolinho de Bacalhau', description: 'Porção com 5 unidades', priceCents: 3300 },
      {
        categoryId: entradas!.id,
        name: 'Mini Linguiças',
        description: 'Porção. Acompanham mostardas e pães',
        priceCents: 3300,
      },
      { categoryId: entradas!.id, name: 'Harumaki', description: 'Camarão ou legumes', priceCents: 3300 },
      { categoryId: entradas!.id, name: 'Sopas', description: 'Consulte as opções do dia', priceCents: 2700 },
      { categoryId: entradas!.id, name: 'Mini Salada', priceCents: 2000 },

      {
        categoryId: peixes!.id,
        name: 'Peixe grelhado no azeite',
        description: 'Especiarias e legumes assados',
        priceCents: 8000,
      },
      {
        categoryId: peixes!.id,
        name: 'Truta grelhada com amêndoas',
        description: 'Batatas gratinadas com queijo',
        priceCents: 8200,
      },

      {
        categoryId: carnes!.id,
        name: 'Mignon grelhado ao molho francês',
        description: 'Batatas arrepiadas',
        priceCents: 8900,
      },
      { categoryId: carnes!.id, name: 'Estrogonofe de Mignon', priceCents: 7400 },

      { categoryId: rosti!.id, name: 'Rosti de Camarão', priceCents: 7300 },
      { categoryId: rosti!.id, name: 'Rosti de Cogumelos', priceCents: 7000 },

      {
        categoryId: vegetariano!.id,
        name: 'Prato da Horta',
        description: 'Legumes orgânicos, azeite e ervas',
        priceCents: 6300,
      },
      { categoryId: vegetariano!.id, name: 'Estrogonofe de Cogumelos', priceCents: 6800 },

      {
        categoryId: infantil!.id,
        name: 'Prato Infantil',
        description: 'Consulte as opções do dia. Serve crianças até 12 anos',
        priceCents: 4200,
      },

      { categoryId: massas!.id, name: 'Massa Empório com Camarões', priceCents: 7300 },
      { categoryId: massas!.id, name: 'Massa Empório com Cogumelos', priceCents: 6000 },

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
