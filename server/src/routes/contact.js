import { Router } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { rateLimit } from '../middleware/rateLimit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES = ['Portrait', 'Editorial', 'Landscape', 'Wedding', 'Commercial', 'Other'];

// same rules as the client form (client/src/sections/Contact/Contact.jsx)
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

async function saveMessage(entry) {
  await fs.mkdir(path.dirname(config.inboxFile), { recursive: true });
  let inbox = [];
  try {
    inbox = JSON.parse(await fs.readFile(config.inboxFile, 'utf8'));
  } catch {
    /* first message */
  }
  inbox.push(entry);
  await fs.writeFile(config.inboxFile, JSON.stringify(inbox, null, 2));
}

export const contactRouter = Router();

contactRouter.post(
  '/',
  rateLimit({ max: 5, windowMs: 10 * 60 * 1000, message: 'Too many messages — try again in a few minutes.' }),
  async (req, res) => {
    // honeypot: real people never fill the hidden "company" field
    if (req.body?.company) return res.json({ ok: true });

    const { clean, errors } = validate(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

    try {
      await saveMessage({ ...clean, receivedAt: new Date().toISOString() });
      console.log(`✉  new enquiry from ${clean.name} <${clean.email}> [${clean.type}]`);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: 'Could not save your message. Please email directly.' });
    }
  }
);
