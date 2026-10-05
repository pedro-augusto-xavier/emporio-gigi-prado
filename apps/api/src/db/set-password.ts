import { eq, sql } from 'drizzle-orm';
import { hashPassword } from '../lib/password.js';
import { revokeAllSessions } from '../modules/auth/session.js';
import { openDatabase } from './connect.js';
import { users } from './schema.js';

/**
 * Troca a senha de um usuário direto no banco (enquanto o painel não tem essa tela).
 * Uso: DATABASE_URL=... USER_EMAIL=... NEW_PASSWORD=... npm run db:set-password -w apps/api
 */
const { DATABASE_URL, USER_EMAIL, NEW_PASSWORD } = process.env;
if (!DATABASE_URL || !USER_EMAIL || !NEW_PASSWORD) {
  throw new Error('Defina DATABASE_URL, USER_EMAIL e NEW_PASSWORD');
}
if (NEW_PASSWORD.length < 12) throw new Error('NEW_PASSWORD precisa ter pelo menos 12 caracteres');

const { db, close } = await openDatabase(DATABASE_URL, { migrate: false });
try {
  const [user] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(NEW_PASSWORD) })
    .where(eq(sql`lower(${users.email})`, USER_EMAIL.toLowerCase()))
    .returning({ id: users.id });
  if (!user) throw new Error(`Nenhum usuário com o e-mail ${USER_EMAIL}`);
  // Quem estava logado com a senha antiga é desconectado.
  await revokeAllSessions(db, user.id, new Date());
  console.log(`Senha de ${USER_EMAIL} trocada. Sessões antigas encerradas.`);
} finally {
  await close();
}
