/**
 * Build-time content preparation. Runs automatically before every `vite` dev
 * session and `vite build` (see the `prepareContent` plugin in vite.config.js),
 * so content edited at /admin is ready without any manual step:
 *
 *  1. Uploaded photos (public/images/uploads, any size / jpg / png / webp …)
 *       → public/images/gen/<file>.webp          (web size, max 2400px)
 *       → public/images/thumbs/gen/<file>.webp   (640px, small frames)
 *  2. The portrait chosen in src/content/profile.json
 *       → public/images/gen/portrait-blur.webp   (viewfinder focus pull)
 *       → public/images/gen/portrait-neg.webp    (darkroom "develop" effect)
 *  3. The photographer's name → src/components/Footer/wordmark.js
 *       (real Instrument Serif outlines, so the footer can "write" it)
 *
 * Generated images are git-ignored: Vercel recreates them on every deploy.
 * Run by hand with:  node scripts/prepare.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(PUBLIC, 'images/uploads');
const GEN = path.join(PUBLIC, 'images/gen');
const GEN_THUMBS = path.join(PUBLIC, 'images/thumbs/gen');
const PROFILE = path.join(ROOT, 'src/content/profile.json');
const WORDMARK = path.join(ROOT, 'src/components/Footer/wordmark.js');
const FONTS = path.join(ROOT, 'scripts/fonts');

const PHOTO = /\.(jpe?g|png|webp|avif|tiff?|gif)$/i;
const PORTRAIT_FILES = new Set(['portrait-blur.webp', 'portrait-neg.webp']);

const newer = (src, out) => !existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs;

/* ---------- 1. uploaded photos ---------- */
async function uploads() {
  mkdirSync(GEN, { recursive: true });
  mkdirSync(GEN_THUMBS, { recursive: true });
  const files = existsSync(UPLOADS) ? readdirSync(UPLOADS).filter((f) => PHOTO.test(f)) : [];
  let made = 0;
  for (const file of files) {
    const src = path.join(UPLOADS, file);
    const full = path.join(GEN, `${file}.webp`);
    const small = path.join(GEN_THUMBS, `${file}.webp`);
    if (!newer(src, full) && !newer(src, small)) continue;
    try {
      // .rotate() applies the camera's EXIF orientation (phone / portrait-mode shots)
      await sharp(src).rotate().resize(2400, 2400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(full);
      await sharp(src).rotate().resize(640, 640, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(small);
      made++;
    } catch (err) {
      console.warn(`[prepare] could not process ${file}: ${err.message}`);
    }
  }
  // tidy outputs whose upload was deleted at /admin
  const keep = new Set(files.map((f) => `${f}.webp`));
  for (const dir of [GEN, GEN_THUMBS]) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.webp') && !keep.has(f) && !PORTRAIT_FILES.has(f)) rmSync(path.join(dir, f));
    }
  }
  return `${files.length} uploads (${made} processed)`;
}

/* ---------- 2. portrait effects (ports of the old tools/images.py, same look) ---------- */
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

async function rgb(pipeline) {
  const { data, info } = await pipeline.flatten({ background: '#000' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function portrait() {
  const { portrait: src } = JSON.parse(readFileSync(PROFILE, 'utf8'));
  const file = path.join(PUBLIC, decodeURI(src || ''));
  if (!src || !existsSync(file)) return `portrait not found (${src})`;

  // out-of-focus copy for the viewfinder focus pull: tiny, blurred, darker, less colour
  {
    const { data, info } = await rgb(sharp(file).rotate().resize(160, 160, { fit: 'inside' }).blur(3));
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i] * 0.7, g = data[i + 1] * 0.7, b = data[i + 2] * 0.7;
      const l = luma(r, g, b);
      data[i] = clamp(l + (r - l) * 0.6);
      data[i + 1] = clamp(l + (g - l) * 0.6);
      data[i + 2] = clamp(l + (b - l) * 0.6);
    }
    await sharp(data, { raw: info }).webp({ quality: 80 }).toFile(path.join(GEN, 'portrait-blur.webp'));
  }

  // colour negative under a red darkroom safelight, for the "develop" effect
  {
    const { data, info } = await rgb(sharp(file).rotate().resize(1200, 1200, { fit: 'inside' }));
    let sum = 0;
    for (let i = 0; i < data.length; i += 3) sum += luma(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]);
    const mean = Math.round(sum / (data.length / 3));
    const dark = [0x1a, 0x0d, 0x05];
    const light = [0xf4, 0xe2, 0xc4];
    const red = [192, 26, 8];
    for (let i = 0; i < data.length; i += 3) {
      // invert, then +25% contrast around the mean grey
      const n = [0, 1, 2].map((c) => clamp(mean + (255 - data[i + c] - mean) * 1.25));
      // 50% blend with a warm duotone of itself
      const t = luma(n[0], n[1], n[2]) / 255;
      const m = [0, 1, 2].map((c) => n[c] * 0.5 + (dark[c] + (light[c] - dark[c]) * t) * 0.5);
      // 60% blend with itself multiplied by safelight red
      for (let c = 0; c < 3; c++) data[i + c] = clamp(m[c] * 0.4 + ((m[c] * red[c]) / 255) * 0.6);
    }
    await sharp(data, { raw: info }).webp({ quality: 72 }).toFile(path.join(GEN, 'portrait-neg.webp'));
  }
  return `portrait effects from ${src}`;
}

/* ---------- 3. footer wordmark ---------- */
const LETTER_SPACING = -0.04; // em, same as .big-mark in Footer.css

function wordmark() {
  const { name = 'Arvin' } = JSON.parse(readFileSync(PROFILE, 'utf8'));
  const load = (file) => {
    const buf = readFileSync(path.join(FONTS, file));
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  };
  const upright = load('InstrumentSerif-Regular.ttf');
  const italic = load('InstrumentSerif-Italic.ttf');
  const upm = upright.unitsPerEm;
  // first letter upright, the rest italic, then an upright red full stop
  const chars = [...name.trim()].map((ch, i) => [ch, i ? italic : upright, i ? 'ch it' : 'ch']);
  chars.push(['.', upright, 'ch dot']);

  let x = 0;
  let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, -Infinity];
  const glyphs = [];
  for (const [ch, font, cls] of chars) {
    const glyph = font.charToGlyph(ch);
    const p = glyph.getPath(x, 0, upm); // font units, y already flipped to SVG's y-down
    if (p.commands.length) {
      const b = p.getBoundingBox();
      [x1, y1, x2, y2] = [Math.min(x1, b.x1), Math.min(y1, b.y1), Math.max(x2, b.x2), Math.max(y2, b.y2)];
      glyphs.push({ ch, cls, d: p.toPathData(1) });
    }
    x += glyph.advanceWidth + LETTER_SPACING * upm;
  }
  const pad = 0.02 * upm; // room for the outline stroke
  const viewBox = [x1 - pad, y1 - pad, x2 - x1 + 2 * pad, y2 - y1 + 2 * pad].map(Math.round);
  const out =
    '// Generated by scripts/prepare.mjs from Instrument Serif (SIL Open Font License).\n' +
    '// Do not edit by hand: it is rebuilt from the name in src/content/profile.json.\n' +
    `export default ${JSON.stringify({ name, upm, viewBox, glyphs }, null, 2)};\n`;
  // only write on change, so the dev server doesn't reload for nothing
  if (!existsSync(WORDMARK) || readFileSync(WORDMARK, 'utf8') !== out) writeFileSync(WORDMARK, out);
  return `wordmark "${name}."`;
}

export async function prepare() {
  const t = Date.now();
  const done = [await uploads(), await portrait(), wordmark()];
  console.log(`[prepare] ${done.join(' · ')} (${Date.now() - t}ms)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepare().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
