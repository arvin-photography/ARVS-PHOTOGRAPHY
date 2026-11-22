import gsap from 'gsap';
import { playShutter } from './sound';

// Global effect handles registered by components.
export const fx = {
  iris: null, // { el, set(t) }  t: 0 closed → 1 open
  curtains: null, // HTMLElement with two child curtains (touch devices)
  flash: null, // HTMLElement
  setFrameloop: null, // r3f frameloop setter
  hud: null, // { focal, dist } elements updated from the render loop
  pressShutterButton: null, // animates the 3D shutter button
};

let shutterTl = null;

const compactScreen = () => window.matchMedia('(hover: none), (pointer: coarse), (max-width: 899px)').matches;

export function shutter({ flash = true } = {}) {
  playShutter();
  fx.pressShutterButton?.();
  const iris = fx.iris;
  if (fx.curtains && compactScreen()) {
    // phones/tablets: focal-plane curtains (transform only). The SVG iris redraws a
    // full-screen path every frame, which stuttered on phone GPUs at 3× pixel density.
    const [a, b] = fx.curtains.children;
    shutterTl?.kill();
    shutterTl = gsap
      .timeline()
      .set(fx.curtains, { autoAlpha: 1 })
      .to([a, b], { scaleY: 1, duration: 0.08, ease: 'power2.in' })
      .to([a, b], { scaleY: 0, duration: 0.22, delay: 0.04, ease: 'power2.out' })
      .set(fx.curtains, { autoAlpha: 0 });
  } else if (iris) {
    shutterTl?.kill();
    const o = { t: 1 };
    shutterTl = gsap
      .timeline()
      .set(iris.el, { autoAlpha: 1 })
      .to(o, { t: 0, duration: 0.09, ease: 'power2.in', onUpdate: () => iris.set(o.t) })
      .to(o, { t: 1, duration: 0.26, delay: 0.04, ease: 'power2.out', onUpdate: () => iris.set(o.t) })
      .set(iris.el, { autoAlpha: 0 });
  }
  if (flash && fx.flash) {
    gsap.fromTo(fx.flash, { opacity: 0 }, { opacity: 0.85, duration: 0.05, delay: 0.09, yoyo: true, repeat: 1, repeatDelay: 0.02, ease: 'power1.out' });
  }
}

// Cursor label override (used by the WebGL canvas, which has no DOM targets)
const cursorListeners = new Set();
export const cursorBus = {
  override: null,
  set(label) {
    this.override = label;
    cursorListeners.forEach((fn) => fn(label));
  },
  subscribe(fn) {
    cursorListeners.add(fn);
    return () => cursorListeners.delete(fn);
  },
};
