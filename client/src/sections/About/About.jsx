import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../../data/content';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const root = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);

      // words light up as you read
      gsap.fromTo(
        q('.statement .w'),
        { opacity: 0.13 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: q('.statement')[0], start: 'top 78%', end: 'bottom 45%', scrub: true },
        }
      );

      // counters
      q('.stat-num').forEach((el) => {
        const end = Number(el.dataset.value);
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = Math.round(o.v)),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      gsap.from(q('.stat'), {
        y: 60,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.stats')[0], start: 'top 85%' },
      });

      gsap.from(q('.kit-row'), {
        clipPath: 'inset(0 100% 0 0)',
        stagger: 0.08,
        duration: 1.2,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: q('.kit')[0], start: 'top 80%' },
      });

      // on-location photo: unmask + parallax
      gsap.fromTo(
        q('.loc-mask'),
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: q('.loc')[0], start: 'top 80%' } }
      );
      gsap.fromTo(
        q('.loc img'),
        { yPercent: -12, scale: 1.2 },
        { yPercent: 12, scale: 1.05, ease: 'none', scrollTrigger: { trigger: q('.loc')[0], start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const words = profile.statement.split(' ');

  return (
    <section className="about" id="about" ref={root}>
      <div className="sec-head">
        <span className="idx">(01)</span>
        <span>About</span>
        <span className="rule" />
        <span>Est. {profile.since}</span>
      </div>

      <p className="statement">
        {words.map((w, i) => (
          <span className="w" key={i}>
            {w}{' '}
          </span>
        ))}
      </p>

      <div className="about-grid">
        <div className="stats">
          {profile.stats.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-val">
                <span className="stat-num" data-value={s.value}>
                  0
                </span>
                <span className="stat-suf">{s.suffix}</span>
              </div>
              <p>{s.label}</p>
            </div>
          ))}
        </div>

        <figure className="loc" data-cursor="On location">
          <div className="loc-mask">
            <img src={profile.aboutImage} alt={profile.aboutImageAlt || ''} loading="lazy" decoding="async" />
          </div>
          <figcaption>
            <span>On location</span>
            <span>06:12 — first light</span>
          </figcaption>
        </figure>

        <div className="kit">
          <h3>
            In the <em>bag</em>
          </h3>
          {profile.kit.map(([k, v]) => (
            <div className="kit-row" key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
