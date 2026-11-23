import { UPLOAD_URL } from './config';

const MAX_EDGE = 3000; // px. The site build makes its own web sizes from this.

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/* Turns a photo straight from a camera or phone (often 10–30 MB) into a ≤3000px JPEG,
   upright (EXIF rotation applied). Keeps the repository small and publishing quick. */
export async function prepareUpload(file) {
  if (!file || !/^image\//.test(file.type)) {
    throw new Error(`“${file?.name || 'That file'}” isn’t a photo. Please use a JPG, PNG or WebP image.`);
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`This browser can’t open “${file.name}”. Please save it as a JPG or PNG and try again.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; // transparent PNGs get a black background, like the site
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare the photo.'))), 'image/jpeg', 0.88)
  );
  const base = slug(file.name.replace(/\.[^.]+$/, '')) || 'photo';
  const name = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.jpg`;
  return { name, path: UPLOAD_URL + name, blob, url: URL.createObjectURL(blob), width, height };
}

/* Which file to show for a photo path, best first. The live site serves 640px thumbnails
   and web-sized copies (made at build time); the original upload is the last resort. */
export function imageCandidates(path, large) {
  if (!path) return [];
  if (/^(blob:|data:|https?:)/.test(path)) return [path];
  if (path.startsWith(UPLOAD_URL)) {
    const f = path.slice(UPLOAD_URL.length);
    return large ? [`/images/gen/${f}.webp`, path] : [`/images/thumbs/gen/${f}.webp`, `/images/gen/${f}.webp`, path];
  }
  return large ? [path] : [path.replace('/images/', '/images/thumbs/'), path];
}

export const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
