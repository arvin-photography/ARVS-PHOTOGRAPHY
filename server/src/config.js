import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT) || 8787,
  // built client (npm run build) — served in production
  distDir: path.resolve(root, '../client/dist'),
  // contact-form submissions are appended here
  inboxFile: path.resolve(root, 'data/messages.json'),
};
