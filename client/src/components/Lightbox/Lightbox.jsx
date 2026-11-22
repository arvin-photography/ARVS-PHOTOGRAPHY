import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getLenis } from '../../lib/scroll';
import { thumb } from '../../data/content';
import './Lightbox.css';

export default function Lightbox({ data, onClose }) {
  const [index, setIndex] = useState(0);
  const root = useRef();
  const imgRef = useRef();
  const closing = useRef(false);

  useEffect(() => {
    if (!data) return;
    closing.current = false;
    setIndex(data.index ?? 0);
    getLenis()?.stop();
    gsap.fromTo(root.current, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' });
    gsap.fromTo(imgRef.current, { scale: 1.15, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, delay: 0.3, ease: 'expo.out' });
    return () => getLenis()?.start();
  }, [data]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    gsap.to(root.current, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.6, ease: 'expo.inOut', onComplete: onClose });
  }, [onClose]);

  const go = useCallback(
    (next, dir) => {
      if (!data) return;
      const n = data.images.length;
      gsap.fromTo(
        imgRef.current,
        { autoAlpha: 0, x: dir * 50, filter: 'blur(10px)' },
        { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }
      );
      setIndex(((next % n) + n) % n);
    },
    [data]
  );

  useEffect(() => {
    if (!data) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(index + 1, 1);
      if (e.key === 'ArrowLeft') go(index - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, close, go, index]);

  if (!data) return null;
  const n = data.images.length;

  // touch swipe
  const touch = { x: 0, y: 0 };
  const onTouchStart = (e) => {
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && n > 1) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    else if (dy > 90) close();
  };

  return (
    <div className="lightbox" ref={root} role="dialog" aria-modal="true" aria-label={data.title}>
      <div className="lb-top">
        <span className="lb-title">{data.title}</span>
        <span className="lb-count">
          {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <button className="lb-close" onClick={close} data-cursor="Close">
          Close ✕
        </button>
      </div>
      <div className="lb-stage" onClick={close} data-cursor="Close" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          ref={imgRef}
          src={data.images[index]}
          alt={`${data.title}, image ${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            if (n > 1) go(index + 1, 1);
          }}
          data-cursor={n > 1 ? 'Next' : 'Close'}
        />
      </div>
      {data.blurb && <p className="lb-blurb">{data.blurb}</p>}
      <p className="lb-hint" aria-hidden="true">
        <span className="k">←</span> <span className="k">→</span> browse · <span className="k">Esc</span> close
      </p>
      {n > 1 && (
        <div className="lb-nav">
          <button onClick={() => go(index - 1, -1)} aria-label="Previous image">
            ← Prev
          </button>
          <div className="lb-thumbs">
            {data.images.map((src, i) => (
              <button key={src} className={i === index ? 'is-active' : ''} onClick={() => go(i, i > index ? 1 : -1)} aria-label={`Image ${i + 1}`}>
                <img src={thumb(src)} alt="" decoding="async" />
              </button>
            ))}
          </div>
          <button onClick={() => go(index + 1, 1)} aria-label="Next image">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
