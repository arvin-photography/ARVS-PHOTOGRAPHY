import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { videos, videosSection } from '../../data/content';
import { getLenis } from '../../lib/scroll';
import './Films.css';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');

const Icon = ({ d, fill }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const PLAY = 'M8 5.5v13l10.5-6.5z';
const VOLUME = 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10';
const FULL = 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5';

/* A card that looks like a video player (poster, play button, control bar).
   YouTube / Vimeo: pressing it plays the video right here, in the viewer.
   Other links (OneDrive …): it opens the video in a new tab. */
function Player({ v, i, onPlay }) {
  const has = Boolean(v.link);
  let Tag = 'div';
  let props = { 'aria-label': `${v.title}: coming soon` };
  if (v.embed) {
    Tag = 'button';
    props = { type: 'button', onClick: (e) => onPlay(v, e.currentTarget), 'aria-label': `Play “${v.title}”`, 'data-cursor': 'Play' };
  } else if (has) {
    Tag = 'a';
    props = { href: v.link, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Play “${v.title}” on ${v.source} (opens in a new tab)`, 'data-cursor': 'Play' };
  }

  return (
    <Tag className={`reel${i === 0 ? ' is-feature' : ''}${has ? ' is-live' : ' is-soon'}`} {...props}>
      <div className="reel-screen">
        {v.poster ? (
          <img
            className="reel-poster"
            src={v.poster}
            alt=""
            loading="lazy"
            decoding="async"
            // YouTube only makes the large thumbnail for HD uploads: fall back to the standard one
            onError={(e) => v.posterFallback && e.currentTarget.src !== v.posterFallback && (e.currentTarget.src = v.posterFallback)}
          />
        ) : (
          <span className="reel-poster is-empty" />
        )}
        <span className="reel-shade" />
        <span className="reel-tag">{!has ? 'Coming soon' : v.embed ? `▶ ${v.source}` : `${v.source} ↗`}</span>
        <span className="reel-play">
          <Icon d={PLAY} fill />
        </span>
        <div className="reel-bar" aria-hidden="true">
          <Icon d={PLAY} fill />
          <span className="reel-time">
            00:00 <i>/</i> {v.duration || '--:--'}
          </span>
          <span className="reel-track">
            <i />
          </span>
          <Icon d={VOLUME} />
          <Icon d={FULL} />
        </div>
      </div>
      <div className="reel-info">
        <span className="reel-no">{pad(i + 1)}</span>
        <h3>{v.title}</h3>
        {v.meta && <p>{v.meta}</p>}
      </div>
    </Tag>
  );
}

/* The cinema viewer: YouTube / Vimeo playing on the site, over a dark backdrop. The
   player only loads (and only sets any cookies) once the visitor presses play. */
function Viewer({ video, onClose }) {
  const root = useRef();
  const closeBtn = useRef();
  const closing = useRef(false);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    gsap.to(root.current, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: onClose });
  }, [onClose]);

  useEffect(() => {
    getLenis()?.stop();
    const before = document.activeElement;
    closeBtn.current?.focus({ preventScroll: true });
    const tl = gsap
      .timeline()
      .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
      .fromTo(root.current.querySelector('.viewer-frame'), { clipPath: 'inset(49.5% 0% 49.5% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0.1)
      .fromTo(root.current.querySelectorAll('.viewer-top > *'), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.5 }, 0.45);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      tl.kill();
      window.removeEventListener('keydown', onKey);
      getLenis()?.start();
      before?.focus?.({ preventScroll: true });
    };
  }, [close]);

  return createPortal(
    <div className="viewer" ref={root} role="dialog" aria-modal="true" aria-label={video.title} onClick={close}>
      <div className="viewer-top" onClick={(e) => e.stopPropagation()}>
        <span className="viewer-title">{video.title}</span>
        {video.meta && <span className="viewer-meta">{video.meta}</span>}
        <button type="button" className="viewer-close" ref={closeBtn} onClick={close} data-cursor="Close">
          Close ✕
        </button>
      </div>
      <div className="viewer-frame" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={video.embed}
          title={video.title}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>,
    document.body
  );
}

export default function Films() {
  const root = useRef();
  const [playing, setPlaying] = useState(null);

  useLayoutEffect(() => {
    if (!videos.length) return undefined;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      gsap.from(q('.films-title .line > span'), {
        yPercent: 135,
        stagger: 0.1,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });
      // each player "powers on": the screen opens from the centre line, like a CRT
      q('.reel').forEach((card) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true } })
          .from(card.querySelector('.reel-screen'), { clipPath: 'inset(49.5% 0% 49.5% 0%)', duration: 1.1, ease: 'expo.inOut' })
          .from(card.querySelector('.reel-poster'), { scale: 1.18, duration: 1.6, ease: 'expo.out' }, 0.25)
          .from(card.querySelectorAll('.reel-bar, .reel-tag, .reel-play'), { autoAlpha: 0, y: 10, stagger: 0.06, duration: 0.6, ease: 'power3.out' }, 0.7)
          .from(card.querySelectorAll('.reel-info > *'), { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.8, ease: 'power3.out' }, 0.5);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  if (!videos.length) return null;
  const h = videosSection.heading;

  return (
    <section className="films" id="films" ref={root}>
      <div className="films-head">
        <div className="sec-head">
          <span className="idx">(03)</span>
          <span>Films</span>
          <span className="rule" />
          <span>
            {pad(videos.length)} {videos.length === 1 ? 'reel' : 'reels'}
          </span>
        </div>
        <div className="films-titlerow">
          <h2 className="films-title">
            <span className="line">
              <span>{h.line1}</span>
            </span>
            <span className="line">
              <span>
                <em>{h.accent}</em>
              </span>
            </span>
          </h2>
          {videosSection.intro && <p className="films-intro">{videosSection.intro}</p>}
        </div>
      </div>
      <div className="films-grid">
        {videos.map((v, i) => (
          <Player v={v} i={i} key={`${i}-${v.title}`} onPlay={setPlaying} />
        ))}
      </div>
      {playing && <Viewer video={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
