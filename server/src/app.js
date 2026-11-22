import express from 'express';
import compression from 'compression';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { contactRouter } from './routes/contact.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.json({ limit: '16kb' }));

  /* ---------- API ---------- */
  app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
  app.use('/api/contact', contactRouter);
  app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

  /* ---------- built client (production) ---------- */
  if (existsSync(config.distDir)) {
    app.use(
      express.static(config.distDir, {
        setHeaders(res, file) {
          // hashed bundles + media never change → cache for a year
          if (/[\/]assets[\/]/.test(file) || /\.(glb|webp)$/.test(file)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => res.sendFile(path.join(config.distDir, 'index.html')));
  }

  return app;
}
