import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import './Iris.css';

const BLADES = 7;
const TAU = Math.PI * 2;

/**
 * Full-screen aperture iris drawn as an SVG.
 * `set(t)`: t = 0 fully closed, t = 1 fully open (blades off-screen).
 */
const Iris = forwardRef(function Iris({ className = '', initial = 1, id = 'iris' }, ref) {
  const wrap = useRef();
  const hole = useRef();
  const seams = useRef();
  const svg = useRef();
  const tRef = useRef(initial);

  const draw = useCallback((t) => {
    tRef.current = t;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!svg.current) return;
    svg.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const cx = w / 2;
    const cy = h / 2;
    // circumradius such that the polygon's inradius covers the whole viewport
    const R = (Math.hypot(w, h) / 2 / Math.cos(Math.PI / BLADES)) * 1.03;
    const r = Math.max(0.6, t * R);
    const a = -Math.PI / 2 + (1 - t) * 1.25; // blades rotate as they close

    const pts = [];
    for (let i = 0; i < BLADES; i++) {
      const ang = a + (i * TAU) / BLADES;
      pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
    }
    const poly = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z';
    hole.current.setAttribute('d', `M-2 -2H${w + 2}V${h + 2}H-2Z${poly}`);

    // blade seams: each polygon edge continues outward past its vertex
    const L = R * 2.2;
    const lines = pts
      .map((p, i) => {
        const q = pts[(i + BLADES - 1) % BLADES];
        let dx = p[0] - q[0];
        let dy = p[1] - q[1];
        const len = Math.hypot(dx, dy);
        if (len < 0.001) {
          const ang = a + (i * TAU) / BLADES + Math.PI / 2;
          dx = Math.cos(ang);
          dy = Math.sin(ang);
        } else {
          dx /= len;
          dy /= len;
        }
        return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${(p[0] + dx * L).toFixed(1)} ${(p[1] + dy * L).toFixed(1)}`;
      })
      .join('');
    seams.current.setAttribute('d', lines);
  }, []);

  useImperativeHandle(ref, () => ({ el: wrap.current, set: draw }), [draw]);

  useEffect(() => {
    draw(tRef.current);
    const onResize = () => draw(tRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <div ref={wrap} className={`iris ${className}`} aria-hidden="true">
      <svg ref={svg} preserveAspectRatio="none">
        <defs>
          <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#1f1e1c" />
            <stop offset="55%" stopColor="#111110" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
        </defs>
        <path ref={hole} fill={`url(#${id}-g)`} fillRule="evenodd" />
        <path ref={seams} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
      </svg>
    </div>
  );
});

export default Iris;
