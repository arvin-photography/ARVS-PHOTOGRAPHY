import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prepare } from './scripts/prepare.mjs';

const PROFILE = path.resolve(__dirname, 'src/content/profile.json');

/* Content edited at /admin (Decap CMS) needs a little processing: uploaded photos are
   resized to WebP + thumbnails, the portrait's blur/negative versions and the footer
   wordmark are regenerated. Runs before dev + build, and again in dev when it changes. */
function prepareContent() {
  let running = Promise.resolve();
  const run = () => (running = running.then(prepare).catch((err) => console.error('[prepare]', err)));
  return {
    name: 'prepare-content',
    buildStart: run,
    configureServer(server) {
      const watched = [path.resolve(__dirname, 'public/images/uploads'), PROFILE];
      server.watcher.add(watched);
      let timer;
      const onChange = (file) => {
        if (!watched.some((w) => path.resolve(file).startsWith(w))) return;
        clearTimeout(timer);
        timer = setTimeout(() => run().then(() => server.ws.send({ type: 'full-reload' })), 300);
      };
      ['add', 'change', 'unlink'].forEach((e) => server.watcher.on(e, onChange));
    },
    // page title + description follow the name / brand / role set at /admin
    transformIndexHtml(html) {
      const p = JSON.parse(readFileSync(PROFILE, 'utf8'));
      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      return html.replaceAll('%BRAND%', esc(p.brand)).replaceAll('%NAME%', esc(p.name)).replaceAll('%ROLE%', esc(p.role));
    },
  };
}

export default defineConfig({
  plugins: [react(), prepareContent()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
});
