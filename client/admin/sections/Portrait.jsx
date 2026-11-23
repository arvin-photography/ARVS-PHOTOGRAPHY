import { EditableImage, EditableText } from '../components/Editable';

/* The "developed print" of the photographer that appears after the camera takes the shot. */
export default function Portrait({ data, set }) {
  const p = data.profile;
  const f = (key) => ({ value: p[key], onChange: (v) => set(['profile', key], v) });

  return (
    <div className="ed-site ed-dev">
      <figure className="ed-print">
        <EditableImage path={p.portrait} onChange={(v) => set(['profile', 'portrait'], v)} label="portrait" ratio="3 / 2" large />
        <EditableText as="figcaption" {...f('portraitCaption')} label="Portrait caption" className="ed-print-caption" />
      </figure>
      <div className="ed-dev-copy">
        <p className="ed-kicker">( The one behind the lens )</p>
        <h2 className="ed-dev-name">
          <EditableText value={p.greeting ?? 'Hi, I’m'} onChange={(v) => set(['profile', 'greeting'], v)} label="Greeting" />
          <br />
          <em>
            <EditableText {...f('name')} label="Your name" />.
          </em>
        </h2>
        <EditableText as="p" {...f('lede')} label="Intro sentence" multiline className="ed-dev-lede" />
      </div>
    </div>
  );
}
