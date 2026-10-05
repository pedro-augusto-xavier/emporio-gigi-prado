import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Cada arquivo de teste sobe seu próprio Postgres em memória (PGlite).
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // Cada PGlite usa bastante memória; mais de um ao mesmo tempo derruba os testes
    // quando o PC já está com o site e a API abertos. Um por vez é mais lento, mas confiável.
    maxWorkers: 1,
  },
});
