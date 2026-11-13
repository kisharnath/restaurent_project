import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output only: works on Cloudflare Pages with no adapter.
export default defineConfig({
  output: 'static',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
