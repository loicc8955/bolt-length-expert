import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths for GitHub Pages project sites.
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});