import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prepare } from './scripts/prepare.mjs';
import { editorApi } from './scripts/editor-api.mjs';

const PROFILE = path.resolve(__dirname, 'src/content/profile.json');

/* Content edited at /admin needs a little processing: uploaded photos are resized to
   WebP + thumbnails, the portrait's blur/negative versions and the footer wordmark are
   regenerated. Runs before dev + build, and again in dev when it changes. */
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
        // the website page reloads itself on this (src/main.jsx); the editor page doesn't
        timer = setTimeout(() => run().then(() => server.ws.send({ type: 'custom', event: 'content-prepared' })), 300);
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

// The editor saves to this GitHub repository. On Vercel it comes from the project's git
// connection, so it follows the repo if it is ever moved; locally the default is used.
const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug } = process.env;
const EDITOR_REPO = owner && slug ? `${owner}/${slug}` : '';

export default defineConfig({
  plugins: [react(), prepareContent(), editorApi(__dirname)],
  define: {
    __EDITOR_REPO__: JSON.stringify(EDITOR_REPO),
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      // two pages: the website, and the owner's visual editor at /admin
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
      },
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
});
