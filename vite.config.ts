import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: './',
  resolve: {
    tsconfigPaths: true
  },
  server: {
    host: true
  },
  css: {
    transformer: 'lightningcss'
  },
  build: {
    target: 'esnext',
    cssMinify: 'lightningcss',
    assetsInlineLimit: (filePath) => (filePath.endsWith('.webp') ? false : undefined)
  }
});
