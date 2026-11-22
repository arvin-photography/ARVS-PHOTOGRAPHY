import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cursorBus } from '../../lib/fx';
import { pointer } from '../../lib/rig';
import './Cursor.css';

/** Focus-reticle cursor. Elements opt in with data-cursor="Label" (or "hide"). */
export default function Cursor() {
  const dot = useRef();
  const ring = useRef();
  const label = useRef();

  useEffect(() => {
    // pointer drives the 3D parallax on every device
    const track = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', track, { passive: true });

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return () => window.removeEventListener('pointermove', track);
    document.documentElement.classList.add('has-cursor');

    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.06, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.06, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.22, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.22, ease: 'power3' });

    let domLabel = null;
    const apply = () => {
      const l = cursorBus.override || domLabel;
      const r = ring.current;
      const isText = !!l && l !== 'hide' && l !== 'link';
      r.classList.toggle('is-label', isText);
      r.classList.toggle('is-link', l === 'link');
      document.documentElement.classList.toggle('cursor-hidden', l === 'hide');
      if (isText) label.current.textContent = l;
    };

    let shown = false;
    const move = (e) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e) => {
      const el = e.target.closest?.('[data-cursor], a, button, input, textarea, select, label');
      domLabel = el ? el.getAttribute('data-cursor') || 'link' : null;
      apply();
    };
    const down = () => ring.current.classList.add('is-down');
    const up = () => ring.current.classList.remove('is-down');
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 });

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);
    const unsub = cursorBus.subscribe(apply);
    return () => {
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
      unsub();
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring}>
        <i />
        <i />
        <i />
        <i />
        <span ref={label} className="cursor-label" />
      </div>
    </div>
  );
}
