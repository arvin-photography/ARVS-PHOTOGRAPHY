import Icon from '../components/Icon';
import { EditableText, ItemTools, SecHead } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

// "instagram.com/me" → "https://instagram.com/me"; emails become mailto: links
const normalizeLink = (v) => {
  if (!v || v === '#') return v;
  if (/^(https?:|mailto:|tel:|#)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
};

export default function Contact({ data, set, update }) {
  const p = data.profile;
  const socials = p.socials || [];

  return (
    <div className="ed-site ed-contact">
      <SecHead n="05" title="Contact">
        <span className="ed-avail">
          <i />
          <EditableText value={p.availability} onChange={(v) => set(['profile', 'availability'], v)} label="Availability" />
        </span>
      </SecHead>

      <h2 className="ed-contact-title">
        Let’s make something
        <br />
        <em>worth framing.</em>
      </h2>
      <p className="ed-contact-sub">Tell me a little about your project. I reply to every enquiry within 48 hours.</p>

      <div className="ed-form-mock" aria-hidden="true">
        <span>Your name</span>
        <span>Email</span>
        <span className="is-wide">Project details</span>
        <em>Visitors fill in this form. Each enquiry is emailed to you.</em>
      </div>

      <p className="ed-email">
        Prefer email? <EditableText value={p.email} onChange={(v) => set(['profile', 'email'], v)} label="Contact email" />
      </p>

      <footer className="ed-footer">
        <div className="ed-foot-row">
          <div>
            <span className="ed-lbl">Local time</span>
            <span className="ed-static">Shows the visitor’s clock</span>
          </div>
          <div className="ed-socials">
            <span className="ed-lbl">Elsewhere · your social links</span>
            {socials.map((s, i) => (
              <div className="ed-social ed-item" key={i}>
                <ItemTools
                  index={i}
                  count={socials.length}
                  vertical
                  mini
                  onMove={(to) => update(['profile', 'socials'], (a) => moveItem(a, i, to))}
                  onRemove={() => update(['profile', 'socials'], (a) => removeItem(a, i))}
                  removeLabel="Delete link"
                />
                <EditableText value={s.label} onChange={(v) => set(['profile', 'socials', i, 'label'], v)} label="Name" className="ed-social-name" />
                <span className="ed-social-url">
                  <Icon name="link" size={13} />
                  <EditableText
                    value={s.href === '#' ? '' : s.href}
                    onChange={(v) => set(['profile', 'socials', i, 'href'], v || '#')}
                    label="Link address"
                    placeholder="Paste the link, e.g. instagram.com/yourname"
                    normalize={normalizeLink}
                  />
                </span>
              </div>
            ))}
            <button type="button" className="ed-add-inline" onClick={() => update(['profile', 'socials'], (a = []) => [...a, { label: 'New link', href: '#' }])}>
              <Icon name="plus" /> Add a link
            </button>
          </div>
        </div>

        <div className="ed-signature">
          <EditableText value={p.name} onChange={(v) => set(['profile', 'name'], v)} label="Your name (drawn as a signature)" />
          <span className="ed-sig-dot">.</span>
        </div>
        <div className="ed-legal">
          <span>
            © {new Date().getFullYear()} {p.brand}. All frames reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
