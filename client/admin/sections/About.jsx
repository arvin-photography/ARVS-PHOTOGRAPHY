import Icon from '../components/Icon';
import { EditableImage, EditableText, ItemTools, SecHead } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

export default function About({ data, set, update }) {
  const p = data.profile;
  const stats = p.stats || [];
  const kit = p.kit || [];

  return (
    <div className="ed-site ed-about">
      <SecHead n="01" title="About">
        Est. <EditableText value={p.since} onChange={(v) => set(['profile', 'since'], v)} numeric label="Year you started" />
      </SecHead>

      <EditableText
        as="p"
        value={p.statement}
        onChange={(v) => set(['profile', 'statement'], v)}
        label="About statement"
        multiline
        className="ed-statement"
      />

      <div className="ed-about-grid">
        <div className="ed-stats">
          {stats.map((s, i) => (
            <div className="ed-stat ed-item" key={i}>
              <ItemTools
                index={i}
                count={stats.length}
                onMove={(to) => update(['profile', 'stats'], (a) => moveItem(a, i, to))}
                onRemove={() => update(['profile', 'stats'], (a) => removeItem(a, i))}
                removeLabel="Delete this number"
                mini
              />
              <div className="ed-stat-value">
                <EditableText value={s.value} onChange={(v) => set(['profile', 'stats', i, 'value'], v)} numeric label="Number" />
                <EditableText
                  value={s.suffix}
                  onChange={(v) => set(['profile', 'stats', i, 'suffix'], v)}
                  label="After the number (e.g. +)"
                  placeholder="+"
                  optional
                  className="ed-stat-suffix"
                />
              </div>
              <EditableText as="div" value={s.label} onChange={(v) => set(['profile', 'stats', i, 'label'], v)} label="Label" className="ed-stat-label" />
            </div>
          ))}
          <button type="button" className="ed-add-inline" onClick={() => update(['profile', 'stats'], (a = []) => [...a, { value: 0, suffix: '', label: 'New number' }])}>
            <Icon name="plus" /> Add a number
          </button>
        </div>

        <figure className="ed-about-photo">
          <EditableImage path={p.aboutImage} onChange={(v) => set(['profile', 'aboutImage'], v)} label="About photo" ratio="4 / 5" large />
          <EditableText
            as="figcaption"
            value={p.aboutImageAlt}
            onChange={(v) => set(['profile', 'aboutImageAlt'], v)}
            label="Photo description (read aloud to blind visitors)"
            placeholder="Describe this photo in a few words"
            className="ed-alt"
          />
        </figure>

        <div className="ed-kit">
          <h3>
            In the <em>bag</em>
          </h3>
          {kit.map((k, i) => (
            <div className="ed-kit-row ed-item" key={i}>
              <ItemTools
                index={i}
                count={kit.length}
                vertical
                mini
                onMove={(to) => update(['profile', 'kit'], (a) => moveItem(a, i, to))}
                onRemove={() => update(['profile', 'kit'], (a) => removeItem(a, i))}
                removeLabel="Delete this row"
              />
              <EditableText value={k.label} onChange={(v) => set(['profile', 'kit', i, 'label'], v)} label="Kit category" className="ed-kit-label" />
              <EditableText value={k.detail} onChange={(v) => set(['profile', 'kit', i, 'detail'], v)} label="Kit details" className="ed-kit-detail" />
            </div>
          ))}
          <button type="button" className="ed-add-inline" onClick={() => update(['profile', 'kit'], (a = []) => [...a, { label: 'Category', detail: 'Details' }])}>
            <Icon name="plus" /> Add a row
          </button>
        </div>
      </div>
    </div>
  );
}
