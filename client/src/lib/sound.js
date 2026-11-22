// Synthesised shutter sound (no audio files). Off by default.
let ctx = null;
let enabled = false;
const listeners = new Set();

export const sound = {
  get enabled() {
    return enabled;
  },
  toggle() {
    enabled = !enabled;
    if (enabled && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (enabled) ctx.resume?.();
    listeners.forEach((fn) => fn(enabled));
    if (enabled) playShutter();
    return enabled;
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

function noiseBurst(t0, dur, freq, q, gain) {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t0);
}

function thump(t0, gain) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(150, t0);
  o.frequency.exponentialRampToValueAtTime(45, t0 + 0.08);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.12);
}

export function playShutter() {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  // mirror slap + first curtain
  noiseBurst(t, 0.04, 2600, 0.8, 0.9);
  thump(t, 0.35);
  // second curtain + mirror return
  noiseBurst(t + 0.085, 0.055, 1700, 0.7, 0.75);
  thump(t + 0.085, 0.22);
}

export function playTick() {
  if (!enabled || !ctx) return;
  noiseBurst(ctx.currentTime, 0.012, 4200, 2, 0.25);
}
