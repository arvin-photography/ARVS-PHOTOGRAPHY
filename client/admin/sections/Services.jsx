import Icon from '../components/Icon';
import { EditableImage, EditableText, ItemTools, SecHead, pad } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

export default function Services({ data, set, update }) {
  const services = data.services.services || [];
  const disciplines = data.services.disciplines || [];

  return (
    <div className="ed-site ed-services">
      <div className="ed-marquee">
        {disciplines.map((d, i) => (
          <span className={`ed-disc ed-item${i % 2 ? '' : ' is-outline'}`} key={i}>
            <EditableText value={d} onChange={(v) => set(['services', 'disciplines', i], v)} label="Discipline" />
            <button
              type="button"
              className="ed-disc-x"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => update(['services', 'disciplines'], (a) => removeItem(a, i))}
              title="Remove"
              aria-label={`Remove ${d}`}
            >
              <Icon name="close" size={14} />
            </button>
            <i className="ed-star" aria-hidden="true">
              ✦
            </i>
          </span>
        ))}
        <button type="button" className="ed-add-inline" onClick={() => update(['services', 'disciplines'], (a = []) => [...a, 'New'])}>
          <Icon name="plus" /> Add a word
        </button>
      </div>
      <p className="ed-note">These words scroll across the page in a big ticker.</p>

      <SecHead n="05" title="Commissions">
        What I shoot
      </SecHead>

      <ol className="ed-svc-list">
        {services.map((s, i) => {
          const base = ['services', 'services', i];
          const f = (key) => ({ value: s[key], onChange: (v) => set([...base, key], v) });
          return (
            <li className="ed-svc ed-item" key={i}>
              <ItemTools
                index={i}
                count={services.length}
                vertical
                onMove={(to) => update(['services', 'services'], (a) => moveItem(a, i, to))}
                onRemove={() => update(['services', 'services'], (a) => removeItem(a, i))}
                removeLabel="Delete service"
                confirmText={`Delete the service “${s.title}”? (You can still Undo before publishing.)`}
              />
              <span className="ed-svc-n">{pad(i + 1)}</span>
              <EditableText as="h3" {...f('title')} label="Service name" className="ed-svc-title" />
              <EditableText as="p" {...f('desc')} label="Description" multiline className="ed-svc-desc" />
              <EditableText {...f('meta')} label="Pricing note" className="ed-svc-meta" />
              <div className="ed-svc-photo">
                <EditableImage path={s.image} onChange={(v) => set([...base, 'image'], v)} label="photo" ratio="4 / 5" compact />
                <small>Shown on hover</small>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="ed-add-inline is-wide"
        onClick={() => update(['services', 'services'], (a = []) => [...a, { title: 'New service', desc: 'What it includes.', meta: 'Per project', image: '' }])}
      >
        <Icon name="plus" /> Add a service
      </button>
    </div>
  );
}
