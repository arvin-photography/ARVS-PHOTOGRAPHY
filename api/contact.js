// Vercel function: POST /api/contact
// The contact form on the live site. Vercel can't keep files, so instead of saving to
// server/data/messages.json (what the local Express server does) each enquiry is emailed
// to the owner through Resend (free plan: https://resend.com).
// Env vars: RESEND_API_KEY, CONTACT_TO_EMAIL, optional CONTACT_FROM_EMAIL (see DEPLOY.md).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES = ['Portrait', 'Editorial', 'Landscape', 'Wedding', 'Commercial', 'Other'];

// same rules as the form (client/src/sections/Contact/Contact.jsx) and server/src/routes/contact.js
function validate({ name = '', email = '', type = 'Other', message = '' }) {
  const clean = {
    name: String(name).trim().slice(0, 120),
    email: String(email).trim().slice(0, 200),
    type: TYPES.includes(type) ? type : 'Other',
    message: String(message).trim().slice(0, 4000),
  };
  const errors = {};
  if (clean.name.length < 2) errors.name = 'Tell me your name.';
  if (!EMAIL_RE.test(clean.email)) errors.email = 'That email looks off.';
  if (clean.message.length < 10) errors.message = 'A little more detail, please (10+ characters).';
  return { clean, errors };
}

// light per-instance rate limit: 5 messages / 10 minutes per IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // honeypot: real people never fill the hidden "company" field
  if (body.company) return send(res, 200, { ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return send(res, 429, { ok: false, error: 'Too many messages — try again in a few minutes.' });

  const { clean, errors } = validate(body);
  if (Object.keys(errors).length) return send(res, 400, { ok: false, errors });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    console.error('contact: RESEND_API_KEY / CONTACT_TO_EMAIL not set');
    return send(res, 500, { ok: false, error: 'The form is not connected yet. Please email directly.' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
        to: [to],
        reply_to: clean.email, // hit "Reply" to answer the visitor directly
        subject: `New ${clean.type.toLowerCase()} enquiry from ${clean.name}`,
        text: `${clean.message}\n\n—\n${clean.name} <${clean.email}>\nType: ${clean.type}\nSent from the portfolio contact form, ${new Date().toUTCString()}`,
      }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error(err);
    return send(res, 500, { ok: false, error: 'Could not send your message. Please email directly.' });
  }
};
