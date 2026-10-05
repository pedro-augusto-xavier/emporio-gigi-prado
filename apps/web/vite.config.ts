import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Otimiza React e React Router juntos; separados, o navegador pode carregar duas cópias do React.
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react-router'] },
  server: {
    port: 5173,
    // Em desenvolvimento, /api vai para a API local (mesmo endereço = cookie de login funciona).
    proxy: { '/api': 'http://localhost:3333' },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.tsx'],
  },
});
