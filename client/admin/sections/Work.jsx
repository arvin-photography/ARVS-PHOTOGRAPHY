import Icon from '../components/Icon';
import { AddPhotos, EditableImage, EditableText, ItemTools, SecHead, pad, useDragSort } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

function Series({ base, project, set, update }) {
  const gallery = project.gallery || [];
  const drag = useDragSort((from, to) => update([...base, 'gallery'], (a) => moveItem(a, from, to)));
  return (
    <div className="ed-series">
      <div className="ed-series-head">
        <strong>Series photos · {gallery.length}</strong>
        <span>Shown when a visitor opens this project. Drag to reorder.</span>
      </div>
      <div className="ed-series-grid">
        {gallery.map((g, j) => (
          <div className="ed-series-item ed-item" key={`${j}-${g}`} {...drag(j)}>
            <ItemTools index={j} count={gallery.length} mini onMove={(to) => update([...base, 'gallery'], (a) => moveItem(a, j, to))} />
            <EditableImage
              path={g}
              compact
              ratio="1"
              label="photo"
              onChange={(v) => set([...base, 'gallery', j], v)}
              onRemove={() => update([...base, 'gallery'], (a) => removeItem(a, j))}
            />
            {project.cover === g ? (
              <span className="ed-badge">Cover</span>
            ) : (
              <button type="button" className="ed-chip-btn" onClick={() => set([...base, 'cover'], g)} title="Use this photo as the cover">
                <Icon name="star" size={13} /> Use as cover
              </button>
            )}
          </div>
        ))}
        <AddPhotos compact ratio="1" label="Add" onAdd={(paths) => update([...base, 'gallery'], (a = []) => [...a, ...paths])} />
      </div>
    </div>
  );
}

export default function Work({ data, set, update }) {
  const projects = data.projects.projects || [];
  const list = ['projects', 'projects'];

  const addProject = () =>
    update(list, (a = []) => [
      ...a,
      { title: 'New project', category: 'Category', location: 'Location', year: String(new Date().getFullYear()), cover: '', blurb: '', gallery: [] },
    ]);

  return (
    <div className="ed-site ed-works">
      <SecHead n="02" title="Selected work">
        {pad(projects.length)} projects
      </SecHead>
      <h2 className="ed-works-title">
        Stories told
        <br />
        in <em>1/250th</em> of a second
      </h2>

      <div className="ed-works-grid">
        {projects.map((p, i) => {
          const base = [...list, i];
          const f = (key) => ({ value: p[key], onChange: (v) => set([...base, key], v) });
          return (
            <article className={`ed-work ed-item${i % 2 ? ' is-alt' : ''}`} key={i} id={`project-${i}`}>
              <ItemTools
                index={i}
                count={projects.length}
                onMove={(to) => update(list, (a) => moveItem(a, i, to))}
                onRemove={() => update(list, (a) => removeItem(a, i))}
                removeLabel="Delete project"
                confirmText={`Delete the project “${p.title}”? (You can still Undo before publishing.)`}
              />
              <div className="ed-film">
                <span className="ed-film-code">
                  ARV 400 <b>▸ {12 + i * 2}</b> {12 + i * 2}A
                </span>
                <EditableImage path={p.cover} onChange={(v) => set([...base, 'cover'], v)} label="cover photo" ratio={i % 2 ? '4 / 5' : '3 / 2'} />
                <span className="ed-film-code is-bottom">
                  {p.year} ◂ {pad(i + 1)} — {String(p.category || '').toUpperCase()}
                </span>
              </div>
              <div className="ed-work-info">
                <span className="ed-work-no">{pad(i + 1)}</span>
                <EditableText as="h3" {...f('title')} label="Project title" />
                <p className="ed-work-meta">
                  <EditableText {...f('category')} label="Category" /> — <EditableText {...f('location')} label="Location" />,{' '}
                  <EditableText {...f('year')} label="Year" />
                </p>
                <EditableText as="p" {...f('blurb')} label="Short story (shown when opened)" multiline className="ed-work-blurb" placeholder="A sentence or two about this series" />
              </div>
              <Series base={base} project={p} set={set} update={update} />
            </article>
          );
        })}
        <button type="button" className="ed-add-card" onClick={addProject}>
          <Icon name="plus" size={26} />
          <span>New project</span>
          <small>Then add a cover and photos</small>
        </button>
      </div>
    </div>
  );
}
