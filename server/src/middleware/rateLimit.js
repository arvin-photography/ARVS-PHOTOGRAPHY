// Tiny in-memory rate limiter (per IP). Good enough for a portfolio contact form;
// use a shared store (e.g. Redis) if you ever run more than one server instance.
export function rateLimit({ max, windowMs, message = 'Too many requests — try again later.' }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ ok: false, error: message });
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
}
