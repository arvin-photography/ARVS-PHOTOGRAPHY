import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../../data/content';
import { scrollToTarget } from '../../lib/scroll';
import wordmark from './wordmark';
import './Footer.css';

gsap.registerPlugin(ScrollTrigger);

// isolated so only this <span> re-renders each second (not the whole footer)
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
}

export default function Footer() {
  const root = useRef();

  useLayoutEffect(() => {
    // Plays even with "reduce motion" on (e.g. Windows "Animation effects" off): it is a
    // pen line drawn in place, nothing slides, zooms or parallaxes.
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const letters = q('.big-mark .ch:not(.dot)');
      const dot = q('.big-mark .dot');

      // handwriting: each letter's outline is traced like a pen stroke, then the ink
      // floods in; letters overlap slightly so it reads as one continuous signature.
      // Dashes use each outline's measured length (not pathLength) and are driven as
      // SVG attributes, which every browser interpolates the same way.
      // Blank page until the footer scrolls in (reset returns here).
      letters.forEach((path) => {
        const len = Math.ceil(path.getTotalLength()) + 2;
        gsap.set(path, { attr: { 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len } });
      });
      gsap.set(letters, { fillOpacity: 0, strokeOpacity: 1 });
      gsap.set(dot, { scale: 0, autoAlpha: 0 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: q('.big-mark')[0],
          start: 'top 80%',
          toggleActions: 'play none none reset', // writes again each time you come back down
        },
      });
      letters.forEach((path, i) => {
        const at = i * 0.42;
        tl.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: 1.1, ease: 'power1.inOut' }, at)
          .to(path, { fillOpacity: 1, duration: 0.7, ease: 'power2.out' }, at + 0.75)
          .to(path, { strokeOpacity: 0, duration: 0.5 }, at + 1.1);
      });
      // the full stop lands last, like a pen tapping the paper
      tl.to(dot, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'back.out(3)' }, '-=0.35');
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer className="footer" ref={root}>
      <div className="foot-row">
        <div>
          <span className="lbl">Local time</span>
          <Clock />
        </div>
        <div>
          <span className="lbl">Elsewhere</span>
          <span className="foot-socials">
            {profile.socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </span>
        </div>
        <button className="to-top" onClick={() => scrollToTarget(0, { duration: 2.6 })}>
          Rewind film ↑
        </button>
      </div>
      <div className="big-mark" aria-hidden="true">
        {/* real Instrument Serif outlines (tools/wordmark.py), so each letter can be "written" */}
        <svg viewBox={wordmark.viewBox.join(' ')} style={{ width: `${wordmark.viewBox[2] / wordmark.upm}em` }}>
          {wordmark.glyphs.map((g, i) => (
            <path key={i} className={g.cls} d={g.d} />
          ))}
        </svg>
      </div>
      <div className="foot-legal">
        <span>© {new Date().getFullYear()} {profile.brand}. All frames reserved.</span>
        <span>Sample imagery via Unsplash</span>
      </div>
    </footer>
  );
}
