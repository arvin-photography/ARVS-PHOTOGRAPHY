/**
 * Dev-only endpoints for the visual editor (client/admin) when it runs on your own
 * computer (`npm run dev` → http://localhost:5173/admin/). Instead of committing to
 * GitHub like the live editor, it reads and writes the files directly:
 *
 *   GET  /__editor/content  → the four content JSON files
 *   POST /__editor/save     → { files: { key: jsonText }, uploads: [{ name, base64 }] }
 *
 * Never part of the production build (Vite `apply: 'serve'`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FILES = {
  profile: 'src/content/profile.json',
  projects: 'src/content/projects.json',
  sheet: 'src/content/contact-sheet.json',
  services: 'src/content/services.json',
};
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}\.(jpe?g|png|webp)$/i;

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

export function editorApi(root) {
  return {
    name: 'local-editor-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__editor/content', (req, res) => {
        try {
          const data = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, JSON.parse(readFileSync(path.join(root, f), 'utf8'))]));
          send(res, 200, data);
        } catch (err) {
          send(res, 500, { ok: false, error: err.message });
        }
      });

      server.middlewares.use('/__editor/save', async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' });
        try {
          const { files = {}, uploads = [] } = JSON.parse(await readBody(req));
          const dir = path.join(root, 'public/images/uploads');
          mkdirSync(dir, { recursive: true });
          for (const u of uploads) {
            if (!SAFE_NAME.test(u.name || '')) throw new Error(`Bad file name: ${u.name}`);
            writeFileSync(path.join(dir, u.name), Buffer.from(u.base64, 'base64'));
          }
          for (const [key, text] of Object.entries(files)) {
            if (!FILES[key]) throw new Error(`Unknown content file: ${key}`);
            JSON.parse(text); // refuse anything that isn't valid JSON
            writeFileSync(path.join(root, FILES[key]), text);
          }
          console.log(`[editor] saved ${Object.keys(files).join(', ') || 'nothing'}${uploads.length ? ` + ${uploads.length} photo(s)` : ''}`);
          send(res, 200, { ok: true });
        } catch (err) {
          send(res, 400, { ok: false, error: err.message });
        }
      });
    },
  };
}
