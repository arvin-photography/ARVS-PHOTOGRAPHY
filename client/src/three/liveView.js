import * as THREE from 'three';
import { profile } from '../data/content';

/* The camera's rear LCD as a "live view" of the photographer's portrait (the same photo
   the story later develops), with a minimal camera HUD drawn on top. Painted once into a
   canvas, so it costs one texture upload, not a per-frame redraw. */
const W = 1024;
const H = 683; // 3:2, like the sensor

function drawHud(ctx) {
  ctx.save();
  // top + bottom info bars
  const bar = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
  };
  bar(0, 90);
  bar(H, H - 90);

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '500 30px "JetBrains Mono", ui-monospace, Menlo, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 34, 44);
  ctx.fillText('1/250', 110, 44);
  ctx.fillText('F2.8', 250, 44);
  ctx.fillText('ISO 100', 370, 44);
  ctx.textAlign = 'right';
  ctx.fillText('[ 36 ]', W - 34, H - 44);
  // battery
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.strokeRect(W - 96, 30, 54, 28);
  ctx.fillRect(W - 42, 38, 5, 12);
  ctx.fillRect(W - 91, 35, 36, 18);
  // red dot = ready
  ctx.fillStyle = '#ff3d1f';
  ctx.beginPath();
  ctx.arc(40, H - 44, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'left';
  ctx.fillText('RAW', 62, H - 44);

  // rule-of-thirds grid
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of [W / 3, (2 * W) / 3]) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (const y of [H / 3, (2 * H) / 3]) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  // focus brackets, locked on (green, like the viewfinder later in the story)
  const cx = W / 2;
  const cy = H / 2;
  const s = 70;
  const l = 22;
  ctx.strokeStyle = '#a8ff7c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + dx * s;
    const y = cy + dy * s;
    ctx.moveTo(x, y - dy * l);
    ctx.lineTo(x, y);
    ctx.lineTo(x - dx * l, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function liveViewMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // glTF UVs expect images the other way up from a plain canvas
  texture.anisotropy = 4;

  let photo = null;
  const paint = () => {
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(0, 0, W, H);
    if (photo) {
      // cover-fit the portrait into the 3:2 screen
      const s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight);
      const w = photo.naturalWidth * s;
      const h = photo.naturalHeight * s;
      ctx.drawImage(photo, (W - w) / 2, (H - h) / 2, w, h);
    }
    drawHud(ctx);
    texture.needsUpdate = true;
  };
  paint();

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    photo = img;
    paint();
  };
  img.src = profile.portrait;
  // repaint once the mono font has loaded, so the HUD isn't drawn in a fallback face
  document.fonts?.ready.then(paint);

  // an LCD lights itself: the image is emissive; the dark base + low roughness keeps the
  // glass reflections from the studio lights on top of it
  return new THREE.MeshStandardMaterial({
    color: '#050506',
    emissive: '#ffffff',
    emissiveMap: texture,
    emissiveIntensity: 0.9,
    roughness: 0.16,
    metalness: 0,
    envMapIntensity: 0.55,
  });
}
