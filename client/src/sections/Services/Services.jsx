import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { disciplines, services, thumb } from '../../data/content';
import { getLenis } from '../../lib/scroll';
import './Services.css';

gsap.registerPlugin(ScrollTrigger);

function MarqueeRow({ items, reverse }) {
  const doubled = [...items, ...items];
  return (
    <div className={`mq-row ${reverse ? 'rev' : ''}`}>
      <div className="mq-track">
        {doubled.map((t, i) => (
          <span key={i} className={i % 2 ? 'it' : ''}>
            {t}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const root = useRef();
  const preview = useRef();
  const previewImg = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      /* velocity-reactive marquee */
      const tweens = q('.mq-row').map((row) => {
        const trackEl = row.querySelector('.mq-track');
        const rev = row.classList.contains('rev');
        return gsap.fromTo(trackEl, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: 38, ease: 'none', repeat: -1 });
      });
      // PERF: one persistent ticker eases the speed, instead of spawning new tweens
      // on every scroll event; it only runs while the marquee is on screen.
      const skew = gsap.quickTo(q('.marquee')[0], 'skewY', { duration: 0.6, ease: 'power3' });
      let target = 1;
      let speed = 1;
      const onScroll = ({ velocity }) => {
        const v = velocity || 0;
        const s = 1 + Math.min(Math.abs(v) * 0.25, 6);
        target = v < 0 ? -s : s;
        skew(gsap.utils.clamp(-4, 4, v * 0.15));
      };
      const tick = () => {
        target += ((target < 0 ? -1 : 1) - target) * 0.04; // decay back to idle speed
        speed += (target - speed) * 0.12;
        tweens.forEach((t) => t.timeScale(speed));
      };
      const lenis = getLenis();
      ScrollTrigger.create({
        trigger: q('.marquee')[0],
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive) {
            lenis?.on('scroll', onScroll);
            gsap.ticker.add(tick);
            tweens.forEach((t) => t.play());
          } else {
            lenis?.off('scroll', onScroll);
            gsap.ticker.remove(tick);
            tweens.forEach((t) => t.pause());
          }
        },
      });
      tweens.forEach((t) => t.pause());

      gsap.from(q('.svc'), {
        y: 50,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.svc-list')[0], start: 'top 82%' },
      });

      return () => {
        lenis?.off('scroll', onScroll);
        gsap.ticker.remove(tick);
      };
    }, root);

    /* floating preview following the cursor */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let cleanup = () => {};
    if (fine) {
      const list = root.current.querySelector('.svc-list');
      const px = gsap.quickTo(preview.current, 'x', { duration: 0.6, ease: 'power3' });
      const py = gsap.quickTo(preview.current, 'y', { duration: 0.6, ease: 'power3' });
      const rot = gsap.quickTo(preview.current, 'rotation', { duration: 0.8, ease: 'power3' });
      let lastX = 0;
      let active = null; // the row currently highlighted (driven by JS, not CSS :hover)

      // Scrolling moves the page under a still mouse without firing any pointer
      // events, so CSS :hover and pointerleave go stale. Hover is therefore tracked
      // here and cleared on scroll; the next real mouse move restores it.
      const setRow = (row) => {
        if (row === active) return;
        active?.classList.remove('is-hover');
        active = row;
        if (row) {
          row.classList.add('is-hover');
          if (previewImg.current.getAttribute('src') !== row.dataset.img) previewImg.current.src = row.dataset.img;
          gsap.to(preview.current, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
        } else {
          gsap.to(preview.current, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
        }
      };
      const move = (e) => {
        px(e.clientX);
        py(e.clientY);
        rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
        const row = e.target.closest('.svc');
        if (row && !active) gsap.set(preview.current, { x: e.clientX, y: e.clientY }); // appear at the cursor, not fly in
        setRow(row);
      };
      const leave = () => setRow(null);
      const onPageScroll = () => active && setRow(null);

      list.addEventListener('pointermove', move);
      list.addEventListener('pointerleave', leave);
      const lenis = getLenis();
      lenis?.on('scroll', onPageScroll);
      window.addEventListener('scroll', onPageScroll, { passive: true });
      cleanup = () => {
        list.removeEventListener('pointermove', move);
        list.removeEventListener('pointerleave', leave);
        lenis?.off('scroll', onPageScroll);
        window.removeEventListener('scroll', onPageScroll);
        active?.classList.remove('is-hover');
      };
    }
    return () => {
      cleanup();
      ctx.revert();
    };
  }, []);

  return (
    <section className="services" ref={root}>
      <div className="marquee" aria-hidden="true">
        <MarqueeRow items={disciplines} />
        <MarqueeRow items={[...disciplines].reverse()} reverse />
      </div>

      <div className="svc-wrap">
        <div className="sec-head">
          <span className="idx">(05)</span>
          <span>Commissions</span>
          <span className="rule" />
          <span>What I shoot</span>
        </div>
        <ul className="svc-list">
          {services.map((s, i) => (
            <li className="svc" key={s.title} data-img={thumb(s.image)} data-cursor="hide">
              <span className="svc-no">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="svc-meta">{s.meta}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="svc-preview" ref={preview} aria-hidden="true">
        <img ref={previewImg} alt="" />
      </div>
    </section>
  );
}
