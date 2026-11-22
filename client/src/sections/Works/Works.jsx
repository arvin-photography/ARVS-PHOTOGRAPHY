import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projects } from '../../data/content';
import './Works.css';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');

export default function Works({ onOpen }) {
  const root = useRef();
  const track = useRef();
  const current = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      gsap.from(q('.works-title .line > span'), {
        yPercent: 135,
        stagger: 0.1,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });

      /* desktop: pinned horizontal film strip */
      mm.add('(min-width: 900px)', () => {
        // clientWidth excludes the classic Windows scrollbar (innerWidth includes it)
        const distance = () => track.current.scrollWidth - document.documentElement.clientWidth;
        const scroller = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: q('.works-pin')[0],
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            anticipatePin: 1, // smoother pin start on iOS / touch scrolling
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const i = Math.min(projects.length, Math.max(1, Math.round(self.progress * (projects.length - 1)) + 1));
              if (current.current) current.current.textContent = pad(i);
              q('.works-progress span')[0].style.transform = `scaleX(${self.progress})`;
            },
          },
        });

        // parallax + reveal per frame, tied to the horizontal motion
        q('.work').forEach((card) => {
          const image = card.querySelector('.work-img');
          gsap.fromTo(image, { xPercent: -14 }, {
            xPercent: 14,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true },
          });
          gsap.fromTo(card.querySelector('.work-media'), { clipPath: 'inset(0% 0% 0% 100%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'power2.out',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left 95%', end: 'left 45%', scrub: true },
          });
          gsap.from(card.querySelectorAll('.work-info > *'), {
            y: 40,
            autoAlpha: 0,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left 80%', end: 'left 40%', scrub: true },
          });
        });

        // skew the strip with scroll velocity
        const skew = gsap.quickTo(track.current, 'skewX', { duration: 0.5, ease: 'power3' });
        ScrollTrigger.create({
          trigger: q('.works-pin')[0],
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => skew(gsap.utils.clamp(-3, 3, self.getVelocity() / -700)),
        });
      });

      /* mobile: vertical stack with reveals */
      /* phones: native swipe carousel (CSS scroll-snap). One reveal for the strip,
         and the counter follows the swipe. No per-card scroll-scrubbed parallax. */
      mm.add('(max-width: 899px)', () => {
        gsap.from(q('.work'), {
          x: 60,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: track.current, start: 'top 85%' },
        });
        const el = track.current;
        const cards = q('.work');
        let raf = 0;
        const onSwipe = () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const first = cards[0].getBoundingClientRect().left;
            const step = cards[1] ? cards[1].getBoundingClientRect().left - first : 1;
            const i = gsap.utils.clamp(0, cards.length - 1, Math.round(-((first - el.getBoundingClientRect().left - parseFloat(getComputedStyle(el).paddingLeft)) / step)));
            if (current.current) current.current.textContent = pad(i + 1);
          });
        };
        el.addEventListener('scroll', onSwipe, { passive: true });
        return () => {
          el.removeEventListener('scroll', onSwipe);
          cancelAnimationFrame(raf);
          el.scrollLeft = 0;
        };
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="works" id="work" ref={root}>
      <div className="works-pin">
        <header className="works-head">
          <div className="sec-head">
            <span className="idx">(02)</span>
            <span>Selected work</span>
            <span className="rule" />
            <span className="works-counter">
              <b ref={current}>01</b> / {pad(projects.length)}
            </span>
          </div>
          <h2 className="works-title">
            <span className="line">
              <span>Stories told</span>
            </span>
            <span className="line">
              <span>
                in <em>1/250th</em> of a second
              </span>
            </span>
          </h2>
          <p className="works-swipe" aria-hidden="true">
            Swipe to browse <i>→</i>
          </p>
        </header>

        <div className="works-track" ref={track}>
          {projects.map((p, i) => (
            <article
              className="work"
              key={p.id}
              data-cursor="View series"
              onClick={() => onOpen({ title: p.title, images: p.gallery, blurb: p.blurb, index: 0 })}
            >
              <div className="film">
                <span className="film-code">
                  ARV 400 <b>▸ {12 + i * 2}</b> {12 + i * 2}A
                </span>
                <div className="work-media">
                  <img className="work-img" src={p.cover} alt={`${p.title}: ${p.category}, ${p.location}`} loading="lazy" decoding="async" />
                </div>
                <span className="film-code bottom">
                  {p.year} ◂ {pad(i + 1)} — {p.category.toUpperCase()}
                </span>
              </div>
              <div className="work-info">
                <span className="work-no">{pad(i + 1)}</span>
                <h3>{p.title}</h3>
                <p>
                  {p.category} — {p.location}, {p.year}
                </p>
                <span className="work-cta">View series ({p.gallery.length}) →</span>
              </div>
            </article>
          ))}
          <div className="works-end">
            <p>
              Six stories.
              <br />
              <em>Thousands of frames</em>
              <br />
              left on the cutting-room floor.
            </p>
            <span>Keep scrolling for the contact sheet ↓</span>
          </div>
        </div>
        <div className="works-progress">
          <span />
        </div>
      </div>
    </section>
  );
}
