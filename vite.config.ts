import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: './',
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, './src/lib')
    }
  },
  server: {
    host: true
  },
  build: {
    target: 'esnext'
  }
});
