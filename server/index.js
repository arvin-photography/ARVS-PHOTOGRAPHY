import { existsSync } from 'node:fs';
import { createApp } from './src/app.js';
import { config } from './src/config.js';

createApp().listen(config.port, () => {
  const mode = existsSync(config.distDir) ? '' : '  (API only — run the client with `npm run dev`)';
  console.log(`📷  server ready → http://localhost:${config.port}${mode}`);
});
