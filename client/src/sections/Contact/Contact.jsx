import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../../data/content';
import { shutter } from '../../lib/fx';
import './Contact.css';

gsap.registerPlugin(ScrollTrigger);

const TYPES = ['Portrait', 'Editorial', 'Landscape', 'Wedding', 'Commercial', 'Other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { name: '', email: '', type: 'Portrait', message: '', company: '' };

// same rules as the server, so people get instant feedback
function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (f.message.trim().length < 10) e.message = 'A sentence or two helps (10+ characters).';
  return e;
}

export default function Contact() {
  const root = useRef();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const [sentName, setSentName] = useState('');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      gsap.from(q('.contact-title .line > span'), {
        yPercent: 135,
        stagger: 0.1,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.contact-title')[0], start: 'top 82%' },
      });
      gsap.from(q('.c-reveal'), {
        y: 40,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.contact-card')[0], start: 'top 88%' },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    // clear a field's error as soon as the person fixes it
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      setStatus({ state: 'error', msg: 'Please check the highlighted fields.' });
      root.current.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setStatus({ state: 'sending', msg: '' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrors(data.errors || {});
        setStatus({ state: 'error', msg: data.error || 'Please check the highlighted fields.' });
        return;
      }
      shutter();
      setSentName(form.name.trim().split(' ')[0]);
      setForm(EMPTY);
      setErrors({});
      setStatus({ state: 'sent', msg: '' });
    } catch {
      setStatus({ state: 'error', msg: `Couldn’t reach the server. Please email ${profile.email} instead.` });
    }
  }

  const field = (k) => `field ${errors[k] ? 'has-err' : ''}`;

  return (
    <section className="contact" id="contact" ref={root}>
      <div className="sec-head">
        <span className="idx">(06)</span>
        <span>Contact</span>
        <span className="rule" />
        <span className="contact-avail">
          <span className="dot" /> {profile.availability}
        </span>
      </div>

      <header className="contact-intro">
        <h2 className="contact-title">
          <span className="line">
            <span>Let&rsquo;s make something</span>
          </span>
          <span className="line">
            <span>
              <em>worth framing.</em>
            </span>
          </span>
        </h2>
        <p className="contact-sub c-reveal">Tell me a little about your project. I reply to every enquiry within 48 hours.</p>
      </header>

      <div className="contact-card c-reveal">
        {status.state === 'sent' ? (
          <div className="sent" role="status">
            <span className="sent-icon" aria-hidden="true">✓</span>
            <h3>Thanks{sentName ? `, ${sentName}` : ''} — message received.</h3>
            <p>I’ll get back to you within 48 hours. In the meantime, feel free to browse the work.</p>
            <button className="btn btn-ghost" onClick={() => setStatus({ state: 'idle', msg: '' })}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="cform" onSubmit={submit} noValidate>
            <div className="cform-row">
              <div className={field('name')}>
                <label htmlFor="c-name">Your name</label>
                <input id="c-name" name="name" value={form.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Jane Doe" aria-invalid={!!errors.name} />
                {errors.name && <small>{errors.name}</small>}
              </div>
              <div className={field('email')}>
                <label htmlFor="c-email">Email</label>
                <input id="c-email" name="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
                {errors.email && <small>{errors.email}</small>}
              </div>
            </div>

            <fieldset className="field">
              <legend>What would you like to shoot?</legend>
              <div className="chips">
                {TYPES.map((t) => (
                  <label key={t} className={`chip ${form.type === t ? 'is-on' : ''}`}>
                    <input type="radio" name="type" value={t} checked={form.type === t} onChange={set('type')} />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={field('message')}>
              <label htmlFor="c-msg">Project details</label>
              <textarea id="c-msg" name="message" rows="4" value={form.message} onChange={set('message')} placeholder="Dates, location, the mood you’re after, any references…" aria-invalid={!!errors.message} />
              {errors.message && <small>{errors.message}</small>}
            </div>

            {/* honeypot */}
            <input className="hp" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} aria-hidden="true" />

            <div className="cform-foot">
              <p className={`form-status ${status.state}`} role="status" aria-live="polite">
                {status.msg || 'Replies within 48 hours · No spam, ever.'}
              </p>
              <button type="submit" className="btn btn-solid btn-send" disabled={status.state === 'sending'}>
                {status.state === 'sending' ? 'Sending…' : 'Send enquiry'}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="contact-alt c-reveal">
        <span>Prefer email?</span>
        <a href={`mailto:${profile.email}`} className="contact-mail">
          {profile.email}
        </a>
      </p>
    </section>
  );
}
