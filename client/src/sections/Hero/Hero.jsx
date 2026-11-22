import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CameraScene from '../../three/CameraScene';
import { MODEL_CENTER, VIEWFINDER, rig } from '../../lib/rig';
import { fx, shutter } from '../../lib/fx';
import { profile } from '../../data/content';
import { scrollToTarget } from '../../lib/scroll';
import { hasWebGL } from '../../lib/support';
import Line from '../../components/Line/Line';
import SceneBoundary from './SceneBoundary';
import Masthead from './Masthead';
import Viewfinder from './Viewfinder';
import DevelopedPrint from './DevelopedPrint';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  { at: 0, label: 'Look' },
  { at: 3.6, label: 'Focus' },
  { at: 7.95, label: 'Capture' },
  { at: 8.4, label: 'Develop' },
];
const CAPTURE_AT = 7.95;
const DEVELOP_READY_AT = 11.9; // timeline time when the develop page is fully composed
const GL_OFF_AT = 5.75;

/* The pinned scroll story: hero cover → orbit → viewfinder → shutter → developed print. */
export default function Hero({ introPlay }) {
  const root = useRef();
  const focalEl = useRef();
  const skipTo = useRef(null);
  const distEl = useRef();

  /* register HUD readouts for the render loop */
  useEffect(() => {
    fx.hud = { focal: focalEl.current, dist: distEl.current };
    return () => {
      fx.hud = null;
    };
  }, []);

  /* intro once the preloader iris opens */
  useEffect(() => {
    if (!introPlay) return;
    const q = gsap.utils.selector(root);
    // decode the story photos now, so the viewfinder / capture moments don't stall on
    // a 1600px image decode (most noticeable on phones)
    q('.vf img, .dev img').forEach((img) => img.decode?.().catch(() => {}));
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(rig, { intro: 0, duration: 2.6, ease: 'expo.out' }, 0)
      .fromTo(q('.hero-word .ch'), { yPercent: 135, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.6, stagger: { amount: 0.7 }, ease: 'expo.out' }, 0.1)
      .fromTo(q('.hero-reveal'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.6);
    return () => tl.kill();
  }, [introPlay]);

  /* the scroll story */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(
        {
          wide: '(min-aspect-ratio: 1/1)',
          tall: '(max-aspect-ratio: 1/1)',
          // phones & tablets: shorter story, tighter scroll follow
          compact: '(hover: none), (pointer: coarse), (max-width: 899px)',
        },
        (c) => {
        const { tall, compact } = c.conditions;
        const R1 = tall ? 3.4 : 2.3; // behind-the-camera distance

        // Portrait screens differ a lot in height (iPhone SE 667px … Pro Max 932px), so
        // the camera is fitted into the real free band between the masthead and the
        // intro text instead of using fixed numbers. shiftY: +ve moves the model down.
        const fitPortrait = () => {
          const vh = window.innerHeight;
          const mast = q('.hero-word')[0].getBoundingClientRect();
          const intro = q('.hero-intro')[0].getBoundingClientRect();
          const top = mast.bottom + 18; // camera starts just below the masthead: no overlap on phones
          const bottom = intro.top - 14;
          const band = Math.max(110, bottom - top);
          // the camera is ~1.35× wider than tall in this 3/4 view; keep it inside 86% of the width too
          const height = Math.min(band, (window.innerWidth * 0.86) / 1.35);
          const K = 2.26; // on-screen height (fraction of vh) × distance, measured for this model at fov 32
          return { radius: gsap.utils.clamp(6.2, 16, (K * vh) / height), shiftY: (top + bottom) / 2 / vh - 0.5 };
        };
        const hero = tall ? fitPortrait() : { radius: 4.7, shiftY: 0.1 };

        Object.assign(rig, {
          theta: 0.62, phi: 0.2, radius: hero.radius,
          tx: MODEL_CENTER[0], ty: MODEL_CENTER[1], tz: MODEL_CENTER[2],
          fov: 32, shiftY: hero.shiftY,
          idle: 1, ring: 0, focus: 0,
        });

        const print = q('.print')[0];
        const printImg = q('.print-img')[0];
        const vfFrame = q('.vf-frame')[0];
        // FLIP start state for the print. Desktop: the photo covers the whole screen.
        // Portrait phones: it starts exactly where the viewfinder frame was (a full-width
        // band). Covering a tall phone screen meant scaling the 3:2 print ~4× at 3× pixel
        // density, a huge texture that made the capture moment stutter on phones.
        const cover = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const w = print.offsetWidth;
          const h = print.offsetHeight;
          let s;
          let tx = vw / 2;
          let ty = vh / 2;
          if (tall) {
            s = vfFrame.offsetWidth / printImg.offsetWidth;
            tx = vfFrame.offsetLeft + vfFrame.offsetWidth / 2;
            ty = vfFrame.offsetTop + vfFrame.offsetHeight / 2;
          } else {
            s = Math.max(vw / printImg.offsetWidth, vh / printImg.offsetHeight) * 1.02;
          }
          const cx = print.offsetLeft + w / 2;
          const cy = print.offsetTop + h / 2;
          const icx = print.offsetLeft + printImg.offsetLeft + printImg.offsetWidth / 2;
          const icy = print.offsetTop + printImg.offsetTop + printImg.offsetHeight / 2;
          return { s, x: tx - cx - (icx - cx) * s, y: ty - cy - (icy - cy) * s };
        };

        let prevT = 0;
        let glOn = true;
        let chapter = -1;
        const glWrap = q('.gl-wrap')[0];
        const chapterEls = q('.chapter');
        const bar = q('.chapters-bar span')[0];

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * (compact ? 4.6 : 8)}`, // phones: ~half the scrolling
            pin: true,
            anticipatePin: 1, // smoother pin start on iOS / touch scrolling
            scrub: compact ? 0.4 : 1, // touch: follow the finger closely
            invalidateOnRefresh: true,
          },
          onUpdate() {
            const t = this.time();
            // stop rendering WebGL when it is hidden
            const on = t < GL_OFF_AT;
            if (on !== glOn) {
              glOn = on;
              // fully take the paused canvas out of layout — cheaper for the GPU/compositor
              glWrap.style.display = on ? '' : 'none';
              fx.setFrameloop?.(on ? 'always' : 'never');
            }
            // shutter fires once when crossing forward
            if (prevT < CAPTURE_AT && t >= CAPTURE_AT) shutter({ flash: false });
            prevT = t;
            // chapter indicator
            let idx = 0;
            CHAPTERS.forEach((ch, i) => { if (t >= ch.at) idx = i; });
            if (idx !== chapter) {
              chapter = idx;
              chapterEls.forEach((el, i) => el.classList.toggle('is-active', i === idx));
            }
            bar.style.transform = `scaleX(${this.progress()})`;
          },
        });

        tl
          /* 01 — LOOK: hero out, orbit to the back */
          .to(q('.hero-word .ch'), { yPercent: -135, stagger: { amount: 0.25 }, duration: 0.55, ease: 'power2.in' }, 0)
          .to(q('.hero-reveal'), { autoAlpha: 0, y: -24, stagger: 0.03, duration: 0.6 }, 0)
          // story chrome only appears once the story starts — keeps the cover clean
          .fromTo(q('.chapters, .seq-skip'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.85)
          .to(q('.seq-skip'), { autoAlpha: 0, duration: 0.4 }, 10)
          .to(rig, {
            theta: Math.PI, phi: 0.04, radius: R1,
            tx: VIEWFINDER[0], ty: VIEWFINDER[1], tz: VIEWFINDER[2],
            shiftY: 0, idle: 0.3, ring: 1.6,
            duration: 3.4, ease: 'power2.inOut',
          }, 0.2)
          .fromTo(q('.note-1 .line > span'), { yPercent: 135 }, { yPercent: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 1.0)
          .to(q('.note-1 .line > span'), { yPercent: -135, stagger: 0.05, duration: 0.5, ease: 'power2.in' }, 2.6)
          .fromTo(q('.seq-hud'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.9)

          /* 02 — FOCUS: dolly into the eyepiece */
          .fromTo(q('.note-2 .line > span'), { yPercent: 135 }, { yPercent: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, 3.2)
          .to(q('.note-2 .line > span'), { yPercent: -135, duration: 0.4, ease: 'power2.in' }, 4.3)
          .to(rig, { radius: 0.03, phi: 0, fov: 21, idle: 0, focus: 1, duration: 1.95, ease: 'power3.in' }, 3.6)
          .to(q('.seq-hud'), { autoAlpha: 0, duration: 0.3 }, 4.9)
          .to(q('.blackout'), { opacity: 1, duration: 0.45, ease: 'power1.in' }, 5.1)
          .set(q('.gl-wrap'), { autoAlpha: 0 }, GL_OFF_AT)

          // the eye adjusts: viewfinder window opens
          .set(q('.vf'), { autoAlpha: 1 }, 5.55)
          .fromTo(q('.vf-frame'),
            { clipPath: 'inset(47% 47% 47% 47% round 60px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.1, ease: 'power2.out' }, 5.55)
          .fromTo(q('.vf-hud'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 6.2)
          // focus pull. PERF: crossfade a pre-blurred copy instead of animating
          // `filter: blur()`, which re-filtered a full-screen photo every frame
          .fromTo(q('.vf-photo, .vf-blur'), { scale: 1.16 }, { scale: 1, duration: 1.7, ease: 'power2.out' }, 5.8)
          .fromTo(q('.vf-blur'), { opacity: 1 }, { opacity: 0, duration: 1.55, ease: 'power2.inOut' }, 5.8)
          .fromTo(q('.vf-dim'), { opacity: 1 }, { opacity: 0, duration: 1.4, ease: 'power1.out' }, 5.8)
          .fromTo(q('.vf'), { '--ev': -2.6 }, { '--ev': 0, duration: 1.6, ease: 'power2.out' }, 5.9)
          .fromTo(q('.vf'), { '--af': 0 }, { '--af': 1, duration: 0.12 }, 7.45)

          /* 03 — CAPTURE */
          .to(q('.flash'), { opacity: 1, duration: 0.07, ease: 'power4.in' }, 8.0)
          .set(q('.vf'), { autoAlpha: 0 }, 8.08)
          .set(q('.dev'), { autoAlpha: 1 }, 7.2) // drawn early, hidden under the black viewfinder (no first-paint hitch at capture)
          .to(q('.flash'), { opacity: 0, duration: 0.8, ease: 'power2.out' }, 8.1)

          /* 04 — DEVELOP: negative → positive → print */
          // PERF: a pre-baked safelight negative fades out (opacity only) instead of
          // animating invert/sepia filters plus a full-screen multiply-blend overlay
          .fromTo(q('.dev-neg'), { opacity: 1 }, { opacity: 0, duration: 1.3, ease: 'power1.inOut' }, 8.35)
          .fromTo(print,
            { x: () => cover().x, y: () => cover().y, scale: () => cover().s, rotation: 0 },
            { x: 0, y: 0, scale: 1, rotation: tall ? -1.5 : -2.5, duration: 1.5, ease: 'power3.inOut' }, 9.4)
          .fromTo(q('.paper'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 9.6)
          .fromTo(q('.dev-copy .line > span'), { yPercent: 135 }, { yPercent: 0, stagger: 0.07, duration: 0.9, ease: 'power3.out' }, 10.65)
          .fromTo(q('.dev-caption'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 10.9)
          .to({}, { duration: 0.8 }, 11.5);

        // "Skip intro" lands on the develop page, fully composed (print settled,
        // "Hi, I'm …" revealed). The scroll position comes from this timeline, so it
        // is right for both the long desktop and the shorter phone story.
        skipTo.current = () => {
          const st = tl.scrollTrigger;
          const y = st.start + (st.end - st.start) * (DEVELOP_READY_AT / tl.duration());
          scrollToTarget(y, { duration: 2.2 });
        };

        return () => {
          skipTo.current = null;
          glWrap.style.display = '';
          fx.setFrameloop?.('always');
        };
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="seq" ref={root} id="top">
      <h1 className="sr-only">
        {profile.brand} — {profile.name}, {profile.role}
      </h1>

      <Masthead />

      <div className="gl-wrap">
        {hasWebGL && (
          <SceneBoundary>
            <CameraScene />
          </SceneBoundary>
        )}
      </div>

      {/* hero copy: deliberately minimal (name, camera, one line, one action) */}
      <div className="hero-ui">
        <div className="hero-intro">
          <p className="hero-lede hero-reveal">
            <strong>{profile.role}.</strong>{' '}
            <br />
            Portraits, landscapes &amp; editorial work.
          </p>
          <div className="hero-ctas hero-reveal">
            <a className="btn btn-solid" href="#work" onClick={(e) => { e.preventDefault(); scrollToTarget('#work', { duration: 2.4 }); }}>
              View the work
            </a>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="scroll-down hero-reveal">
        <button onClick={() => scrollToTarget(window.scrollY + window.innerHeight * 1.5, { duration: 1.6 })} aria-label="Scroll down">
          <span className="sd-mouse" aria-hidden="true"><i /></span>
          <span className="sd-label">Scroll down</span>
          <span className="sd-arrow" aria-hidden="true">↓</span>
        </button>
      </div>

      <button className="seq-skip" onClick={() => (skipTo.current ? skipTo.current() : scrollToTarget('#about', { duration: 2 }))}>
        Skip intro <span aria-hidden="true">↓</span>
      </button>

      {/* scroll notes */}
      <p className="note note-1">
        <Line>Every photograph</Line>
        <Line>begins <em>behind</em></Line>
        <Line>the glass.</Line>
      </p>
      <p className="note note-2">
        <Line><em>Look closer.</em></Line>
      </p>

      {/* live lens readout */}
      <div className="seq-hud" aria-hidden="true">
        <span>Focal <b ref={focalEl}>50mm</b></span>
        <span>Subject <b ref={distEl}>3.30m</b></span>
      </div>

      {/* chapter indicator */}
      <ol className="chapters" aria-hidden="true">
        <div className="chapters-bar"><span /></div>
        {CHAPTERS.map((c, i) => (
          <li key={c.label} className={`chapter ${i === 0 ? 'is-active' : ''}`}>
            <span>0{i + 1}</span> {c.label}
          </li>
        ))}
      </ol>

      <div className="blackout" />

      <Viewfinder />

      <DevelopedPrint />

      <div className="flash" />
    </section>
  );
}
