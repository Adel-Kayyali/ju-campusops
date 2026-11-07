import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Long-term cacheable vendor chunks, separate from the application code.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/dates', '@mantine/form', '@mantine/notifications', '@mantine/modals'],
          charts: ['@mantine/charts', 'recharts'],
          data: ['@tanstack/react-query', 'axios', 'dayjs'],
        },
      },
    },
  },
  test: { environment: 'node' },
});
