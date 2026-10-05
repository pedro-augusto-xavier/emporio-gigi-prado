import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import pg from 'pg';
import * as schema from './schema.js';

/**
 * Tipo comum para o banco: em produção usamos node-postgres e nos testes o PGlite.
 * Os dois implementam a mesma API do Drizzle.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  const db: Db = drizzle(pool, { schema });
  return { db, close: () => pool.end() };
}
