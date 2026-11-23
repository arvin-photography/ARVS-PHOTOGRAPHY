import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sheet, sheetHeading } from '../../data/content';
import './ContactSheet.css';

gsap.registerPlugin(ScrollTrigger);

const LOUPE = 210;
const ZOOM = 2.6;

export default function ContactSheet({ onOpen }) {
  const root = useRef();
  const loupe = useRef();
  const loupeInner = useRef();
  const loupeImg = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      gsap.from(q('.sheet-title .line > span'), {
        yPercent: 135,
        stagger: 0.1,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });

      // frames "expose" like paper under the enlarger
      gsap.set(q('.frame-img img'), { filter: 'brightness(0) contrast(1.4)' });
      ScrollTrigger.batch(q('.frame'), {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(
            batch.map((f) => f.querySelector('img')),
            // clearProps: a lingering (even neutral) filter keeps every frame on its own costly layer
            { filter: 'brightness(1) contrast(1)', duration: 1.6, stagger: 0.09, ease: 'power2.out', clearProps: 'filter' }
          ),
      });

      gsap.fromTo(
        q('.sheet-paper'),
        { rotate: -1.5, y: 80 },
        { rotate: 0.6, y: -40, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    }, root);

    /* loupe */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return () => ctx.revert();
    const grid = root.current.querySelector('.sheet-grid');
    const lx = gsap.quickTo(loupe.current, 'x', { duration: 0.25, ease: 'power3' });
    const ly = gsap.quickTo(loupe.current, 'y', { duration: 0.25, ease: 'power3' });
    let visible = false;

    const move = (e) => {
      const cell = e.target.closest('.frame-img');
      if (!cell) {
        if (visible) {
          visible = false;
          gsap.to(loupe.current, { scale: 0.4, autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
        }
        return;
      }
      const r = cell.getBoundingClientRect();
      const src = cell.querySelector('img').currentSrc;
      if (loupeImg.current.getAttribute('src') !== src) loupeImg.current.setAttribute('src', src);
      const w = r.width * ZOOM;
      const h = r.height * ZOOM;
      const tx = LOUPE / 2 - (e.clientX - r.left) * ZOOM;
      const ty = LOUPE / 2 - (e.clientY - r.top) * ZOOM;
      gsap.set(loupeInner.current, { width: w, height: h, x: tx, y: ty });
      lx(e.clientX);
      ly(e.clientY);
      if (!visible) {
        visible = true;
        gsap.set(loupe.current, { x: e.clientX, y: e.clientY });
        gsap.to(loupe.current, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' });
      }
    };
    const leave = () => {
      visible = false;
      gsap.to(loupe.current, { scale: 0.4, autoAlpha: 0, duration: 0.3 });
    };
    grid.addEventListener('pointermove', move);
    grid.addEventListener('pointerleave', leave);
    return () => {
      grid.removeEventListener('pointermove', move);
      grid.removeEventListener('pointerleave', leave);
      ctx.revert();
    };
  }, []);

  return (
    <section className="sheet" id="archive" ref={root}>
      <div className="sheet-head">
        <div className="sec-head">
          <span className="idx">(03)</span>
          <span>The archive</span>
          <span className="rule" />
          <span>
            Roll 07 · {sheet.length} frames
          </span>
        </div>
        <h2 className="sheet-title">
          <span className="line">
            <span>{sheetHeading.line1}</span>
          </span>
          <span className="line">
            <span>
              <em>{sheetHeading.accent}</em>
            </span>
          </span>
        </h2>
        <p className="sheet-note">
          Where the real editing happens — every frame from the roll, side by side. Hover a frame to inspect it under the loupe; click to view it full size.
        </p>
      </div>

      <div className="sheet-paper">
        <div className="sheet-grid">
          {sheet.map((f, i) => (
            <figure className="frame" key={f.n}>
              <div
                className="frame-img"
                data-cursor="hide"
                onClick={() => onOpen({ title: `Contact sheet — frame ${f.n}`, images: sheet.map((s) => s.src), index: i })}
              >
                <img src={f.thumb} alt={`Contact sheet frame ${f.n}`} loading="lazy" decoding="async" />
              </div>
              <figcaption>
                <span>▸ {f.n}</span>
                <span>{f.n}A</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="sheet-foot">
          <span>ARV 400 — ROLL 07</span>
          <span>Printed under safelight · 8×10 in</span>
          <span>Frames {sheet[0].n}–{sheet[sheet.length - 1].n}</span>
        </div>
      </div>

      <div className="loupe" ref={loupe} aria-hidden="true">
        <div className="loupe-inner" ref={loupeInner}>
          <img ref={loupeImg} alt="" />
        </div>
        <span className="loupe-ret" />
      </div>
    </section>
  );
}
