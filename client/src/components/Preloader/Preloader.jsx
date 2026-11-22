import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import Iris from '../Iris/Iris';
import { profile } from '../../data/content';
import './Preloader.css';

const STOPS = ['f/22', 'f/16', 'f/11', 'f/8', 'f/5.6', 'f/4', 'f/2.8', 'f/2', 'f/1.4'];
// first visit gets the full ceremony; returning visitors (same tab session) skip ahead
const seenBefore = (() => {
  try {
    const seen = sessionStorage.getItem('arv-seen') === '1';
    sessionStorage.setItem('arv-seen', '1');
    return seen;
  } catch {
    return false;
  }
})();
const MIN_TIME = seenBefore || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 400 : 1800;

export default function Preloader({ onReveal, onDone }) {
  const { progress, active } = useProgress();
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);
  const root = useRef();
  const iris = useRef();
  const start = useRef(performance.now());
  const counter = useRef({ v: 0 });
  const finished = useRef(false);

  // ease the visible counter towards the real progress
  useEffect(() => {
    const target = active ? Math.min(progress, 96) : progress;
    gsap.to(counter.current, {
      v: target,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => setShown(Math.round(counter.current.v)),
      overwrite: true,
    });
  }, [progress, active]);

  useEffect(() => {
    iris.current?.set(0);
    // safety net: never trap the visitor behind the loader
    const safety = setTimeout(() => finish(), 9000);
    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active && progress >= 100) {
      const wait = Math.max(0, MIN_TIME - (performance.now() - start.current));
      const id = setTimeout(finish, wait);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, progress]);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    const o = { t: 0 };
    gsap
      .timeline({ onComplete: () => { setGone(true); onDone?.(); } })
      .to(counter.current, { v: 100, duration: 0.4, ease: 'power1.out', onUpdate: () => setShown(Math.round(counter.current.v)) })
      .to(root.current.querySelectorAll('.pl-fade'), { autoAlpha: 0, y: -14, duration: 0.5, stagger: 0.05, ease: 'power2.in' }, '+=0.15')
      .add(() => onReveal?.(), '-=0.1')
      .to(o, { t: 1, duration: 1.5, ease: 'expo.inOut', onUpdate: () => iris.current?.set(o.t) }, '<');
  }

  if (gone) return null;
  const stop = STOPS[Math.min(STOPS.length - 1, Math.floor((shown / 100) * STOPS.length))];

  return (
    <div className="preloader" ref={root}>
      <Iris ref={iris} initial={0} id="pl-iris" />
      <div className="pl-ui">
        <div className="pl-top pl-fade">
          <span>{profile.brand}</span>
          <span>Loading film</span>
        </div>
        <div className="pl-center pl-fade">
          <span className="pl-count">{String(shown).padStart(3, '0')}</span>
          <span className="pl-stop">{stop}</span>
        </div>
        <div className="pl-bottom pl-fade">
          <div className="pl-bar">
            <span style={{ transform: `scaleX(${shown / 100})` }} />
          </div>
          <span>Opening aperture…</span>
        </div>
      </div>
    </div>
  );
}
