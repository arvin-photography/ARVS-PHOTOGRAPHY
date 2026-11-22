import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../../data/content';
import { scrollToTarget } from '../../lib/scroll';
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
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current.querySelectorAll('.big-mark .ch'),
        { yPercent: 100 },
        {
          yPercent: 0,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'bottom bottom', scrub: 1 },
        }
      );
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
        {[...profile.name].map((ch, i) => (
          <span key={i} className={i ? 'ch it' : 'ch'}>
            {ch}
          </span>
        ))}
        <span className="ch dot">.</span>
      </div>
      <div className="foot-legal">
        <span>© {new Date().getFullYear()} {profile.brand}. All frames reserved.</span>
        <span>Sample imagery via Unsplash</span>
      </div>
    </footer>
  );
}
