import { AddPhotos, EditableImage, EditableText, ItemTools, SecHead, useDragSort } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

export default function Sheet({ data, set, update }) {
  const frames = data.sheet.frames || [];
  const path = ['sheet', 'frames'];
  const drag = useDragSort((from, to) => update(path, (a) => moveItem(a, from, to)));
  const heading = { line1: 'The contact', accent: 'sheet.', ...data.sheet.heading };
  const setHeading = (key, v) => set(['sheet', 'heading'], { ...heading, [key]: v });

  return (
    <div className="ed-site ed-sheet">
      <SecHead n="03" title="The archive" light>
        Roll 07 · {frames.length} frames
      </SecHead>
      <h2 className="ed-sheet-title">
        <EditableText value={heading.line1} onChange={(v) => setHeading('line1', v)} label="Heading, line 1" />
        <em>
          <EditableText value={heading.accent} onChange={(v) => setHeading('accent', v)} label="Heading, red italic line" />
        </em>
      </h2>
      <div className="ed-sheet-paper">
        <div className="ed-sheet-grid">
          {frames.map((src, i) => (
            <div className="ed-frame ed-item" key={`${i}-${src}`} {...drag(i)}>
              <ItemTools index={i} count={frames.length} mini onMove={(to) => update(path, (a) => moveItem(a, i, to))} />
              <EditableImage
                path={src}
                compact
                ratio="3 / 2"
                label="photo"
                onChange={(v) => set([...path, i], v)}
                onRemove={frames.length > 1 ? () => update(path, (a) => removeItem(a, i)) : undefined}
              />
              <span className="ed-frame-n">
                ▸ {12 + i} <b>{12 + i}A</b>
              </span>
            </div>
          ))}
          <AddPhotos ratio="3 / 2" label="Add photos" onAdd={(paths) => update(path, (a = []) => [...a, ...paths])} />
        </div>
      </div>
    </div>
  );
}
