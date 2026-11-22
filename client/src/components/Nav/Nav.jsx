import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../../lib/sound';
import { getLenis, scrollToTarget } from '../../lib/scroll';
import { profile } from '../../data/content';
import './Nav.css';

gsap.registerPlugin(ScrollTrigger);

const LINKS = [
  ['About', '#about'],
  ['Work', '#work'],
  ['Archive', '#archive'],
  ['Contact', '#contact'],
];

export default function Nav() {
  const [on, setOn] = useState(sound.enabled);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const nav = useRef();
  const bar = useRef();
  const menu = useRef();

  useEffect(() => sound.subscribe(setOn), []);

  /* hide on scroll down, reveal on scroll up + page progress line */
  useEffect(() => {
    const lenis = getLenis();
    if (!lenis) return;
    let hidden = false;
    const onScroll = ({ scroll, direction, limit }) => {
      bar.current.style.transform = `scaleX(${limit ? scroll / limit : 0})`;
      const hide = direction === 1 && scroll > window.innerHeight * 0.5;
      const show = direction === -1 || scroll < 80;
      if (hide && !hidden) {
        hidden = true;
        nav.current.classList.add('is-hidden');
      } else if (show && hidden) {
        hidden = false;
        nav.current.classList.remove('is-hidden');
      }
    };
    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, []);

  /* active section */
  useEffect(() => {
    const triggers = LINKS.map(([, id]) =>
      ScrollTrigger.create({
        trigger: id,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(id),
        onLeaveBack: () => id === '#about' && setActive(null),
      })
    );
    // dark nav text while the light contact sheet is under it (no blend mode needed)
    triggers.push(
      ScrollTrigger.create({
        trigger: '#archive',
        start: 'top 40px',
        end: 'bottom 40px',
        toggleClass: { targets: nav.current, className: 'on-light' },
      })
    );
    ScrollTrigger.sort();
    return () => triggers.forEach((t) => t.kill());
  }, []);

  /* mobile menu */
  useEffect(() => {
    const lenis = getLenis();
    const el = menu.current;
    if (open) {
      lenis?.stop();
      gsap.set(el, { visibility: 'visible' });
      gsap
        .timeline()
        .fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' })
        .fromTo(el.querySelectorAll('.mm-link > span'), { yPercent: 135 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.35)
        .fromTo(el.querySelectorAll('.mm-foot > *'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.6 }, 0.55);
      const onKey = (e) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    // only undo what opening did (never unlock scroll during the preloader)
    if (el.style.visibility === 'visible') {
      gsap.to(el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.6,
        ease: 'expo.inOut',
        onComplete: () => gsap.set(el, { visibility: 'hidden' }),
      });
      lenis?.start();
    }
  }, [open]);

  const go = (e, href) => {
    e.preventDefault();
    setOpen(false);
    scrollToTarget(href);
  };

  return (
    <>
      <span className="page-progress" ref={bar} aria-hidden="true" />
      <header className={`nav ${open ? 'is-open' : ''}`} ref={nav}>
        <a href="#top" className="nav-brand" onClick={(e) => go(e, 0)} aria-label={`${profile.brand} — back to top`}>
          <span className="rec" /> {profile.brandShort}
          <small>Photography</small>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map(([label, href], i) => (
            <a key={href} href={href} onClick={(e) => go(e, href)} className={active === href ? 'is-active' : ''} aria-current={active === href ? 'true' : undefined}>
              <sup>0{i + 1}</sup>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <button className={`nav-sound ${on ? 'is-on' : ''}`} onClick={() => sound.toggle()} aria-pressed={on} aria-label={`Shutter sound ${on ? 'on' : 'off'}`} title={`Shutter sound: ${on ? 'on' : 'off'}`}>
            <span className="bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
          <a className="nav-cta" href="#contact" onClick={(e) => go(e, '#contact')}>
            Book a shoot
          </a>
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu">
            <span>{open ? 'Close' : 'Menu'}</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mobile-menu" id="mobile-menu" ref={menu} aria-hidden={!open}>
        <nav className="mm-links" aria-label="Mobile">
          {LINKS.map(([label, href], i) => (
            <a key={href} href={href} className="mm-link" onClick={(e) => go(e, href)} tabIndex={open ? 0 : -1}>
              <span>
                <sup>0{i + 1}</sup>
                {i % 2 ? <em>{label}</em> : label}
              </span>
            </a>
          ))}
        </nav>
        <div className="mm-foot">
          <a href={`mailto:${profile.email}`} tabIndex={open ? 0 : -1}>
            {profile.email}
          </a>
          <span>
            <span className="dot" /> {profile.availability}
          </span>
        </div>
      </div>
    </>
  );
}
