import { mkdirSync } from 'node:fs';
import { createDb, type Db } from './client.js';
import { migrationsFolder, runMigrations } from './migrate.js';
import * as schema from './schema.js';

export interface Database {
  db: Db;
  close: () => Promise<void>;
}

const PGLITE_PREFIX = 'pglite:';

export function isEmbeddedDatabase(url: string): boolean {
  return url.startsWith(PGLITE_PREFIX);
}

/**
 * Abre o banco a partir do DATABASE_URL:
 * - "postgres://..."      -> PostgreSQL de verdade (produção / Docker)
 * - "pglite:./.data/dev"  -> Postgres embutido salvo numa pasta, só para desenvolvimento
 *   (não precisa instalar nada; as migrações são aplicadas automaticamente).
 */
export async function openDatabase(url: string, options: { migrate: boolean }): Promise<Database> {
  if (isEmbeddedDatabase(url)) {
    // Import dinâmico: o PGlite é dependência de desenvolvimento e não existe na imagem de produção.
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');

    const dataDir = url.slice(PGLITE_PREFIX.length);
    mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir);
    await migrate(drizzle(client), { migrationsFolder });
    const db: Db = drizzle(client, { schema });
    return { db, close: () => client.close() };
  }

  if (options.migrate) await runMigrations(url);
  return createDb(url);
}
