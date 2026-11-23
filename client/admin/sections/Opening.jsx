import { EditableText } from '../components/Editable';

/* The first screen: studio name over the 3D camera, the tagline and the scroll badge. */
export default function Opening({ data, set }) {
  const p = data.profile;
  const f = (key) => ({ value: p[key], onChange: (v) => set(['profile', key], v) });

  return (
    <div className="ed-site ed-hero">
      <div className="ed-nav">
        <span className="ed-nav-logo">
          <i className="ed-dot" />
          <EditableText {...f('brandShort')} label="Short studio name (menu logo)" className="ed-nav-short" />
          <small>Photography</small>
        </span>
        <span className="ed-nav-links" aria-hidden="true">
          <span>01 About</span>
          <span>02 Work</span>
          <span>03 Archive</span>
          <span>04 Contact</span>
        </span>
        <span className="ed-nav-cta" aria-hidden="true">
          Book a shoot
        </span>
      </div>

      <EditableText
        as="h1"
        {...f('brand')}
        label="Studio name (shown in capitals)"
        className="ed-masthead"
        decorate={(html) => html.replace(/^(\S+)(\s+)([\s\S]+)$/, '$1$2<em>$3</em>')}
      />

      <div className="ed-hero-camera" aria-hidden="true">
        <span>3D camera</span>
      </div>

      <div className="ed-hero-foot">
        <p className="ed-hero-lede">
          <strong>
            <EditableText {...f('role')} label="Role / tagline" />.
          </strong>
          <br />
          <span className="ed-static">Portraits, landscapes &amp; editorial work.</span>
        </p>
        <span className="ed-scroll-badge" aria-hidden="true" title="Scroll badge (automatic)">
          <span>↓</span>
        </span>
      </div>
    </div>
  );
}
