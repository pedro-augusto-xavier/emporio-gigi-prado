import { buildApp } from './app.js';
import { openDatabase } from './db/connect.js';
import { loadEnv } from './env.js';

const env = loadEnv();

const { db, close } = await openDatabase(env.DATABASE_URL, { migrate: env.RUN_MIGRATIONS });
const app = await buildApp({ db, env });
app.addHook('onClose', close);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info(`${signal} recebido, encerrando...`);
    await app.close();
    process.exit(0);
  });
}

await app.listen({ host: env.HOST, port: env.PORT });
