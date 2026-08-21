import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    allowedHosts: ['sb-365ncavku01d.vercel.run,sb-5if2fiqq9aqj.vercel.run'],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});