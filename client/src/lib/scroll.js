import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// PERF: don't recompute every trigger when a mobile URL bar shows/hides
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis = null;
const raf = (time) => lenis?.raf(time * 1000);

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initLenis() {
  if (lenis) return lenis;
  const reduce = reducedMotion();
  lenis = new Lenis({ lerp: reduce ? 1 : 0.085, smoothWheel: !reduce, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

export function destroyLenis() {
  gsap.ticker.remove(raf);
  lenis?.destroy();
  lenis = null;
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) return lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  const el = typeof target === 'string' ? document.querySelector(target) : null;
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else window.scrollTo({ top: typeof target === 'number' ? target : 0, behavior: 'smooth' });
}
