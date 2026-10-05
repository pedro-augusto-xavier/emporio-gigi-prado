import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Cada arquivo de teste sobe seu próprio Postgres em memória (PGlite).
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // Cada PGlite (Postgres em memória) é pesado. Rodar um arquivo por vez, reaproveitando o mesmo
    // processo, evita falta de memória quando o PC já está com o site e a API abertos.
    maxWorkers: 1,
    isolate: false,
  },
});
