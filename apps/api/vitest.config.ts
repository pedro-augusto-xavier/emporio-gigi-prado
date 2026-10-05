import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Cada arquivo de teste sobe seu próprio Postgres em memória (PGlite).
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // Cada PGlite usa bastante memória; muitos em paralelo derrubam os workers.
    maxWorkers: 2,
  },
});
