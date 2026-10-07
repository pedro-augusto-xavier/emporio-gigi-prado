import { eq, sql } from 'drizzle-orm';
import { hashPassword } from '../lib/password.js';
import type { Db } from './client.js';
import { openDatabase } from './connect.js';
import { users } from './schema.js';
import { syncMenu } from './sync-menu.js';

/** Dados iniciais: um admin e o cardápio (de src/menu/cardapio.ts). Pode rodar mais de uma vez. */
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

  console.log((await syncMenu(db)) ? 'Cardápio do Empório criado/atualizado.' : 'Cardápio já estava em dia.');
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
