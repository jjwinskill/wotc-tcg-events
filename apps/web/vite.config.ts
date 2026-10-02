import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Keep the Host header (no changeOrigin): the API builds the QR registration URL from it.
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
