// Feature detection shared by the app.

// WebGL can be missing or disabled: iOS Lockdown Mode, some managed/school devices,
// very old GPUs or blocklisted drivers. three.js r170 needs WebGL 2.
export const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context
    return ok;
  } catch {
    return false;
  }
})();

export const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
