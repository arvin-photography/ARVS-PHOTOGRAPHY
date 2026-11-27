// Shared, mutable state that GSAP tweens (DOM side) and react-three-fiber
// reads every frame (WebGL side). No React re-renders involved.

// Model landmarks (from the GLB): lens points +Z, viewfinder sits on the back.
export const MODEL_CENTER = [0, 0.52, 0.28];
export const VIEWFINDER = [0.06, 0.89, -0.36];

export const rig = {
  // spherical camera orbit around a target
  theta: 0.62, // 0 = in front of the lens, PI = behind (viewfinder side)
  phi: 0.2, // elevation
  radius: 3.4,
  tx: MODEL_CENTER[0],
  ty: MODEL_CENTER[1],
  tz: MODEL_CENTER[2],
  fov: 32,
  shiftY: 0, // screen-space vertical offset (fraction of viewport)
  shiftX: 0, // screen-space horizontal offset (fraction of viewport, +ve = model moves right)
  idle: 1, // 1 = floating / mouse-reactive, 0 = locked for the viewfinder dolly
  ring: 0, // zoom ring rotation
  focus: 0, // focus ring rotation
  intro: 1, // 1 = before intro, animates to 0 after preloader
};

export const pointer = { x: 0, y: 0 }; // normalised -1..1
