import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hasFiles, imageCandidates } from '../lib/images';
import Icon from './Icon';

/* Shared editor services (uploads, toasts) for every editable piece. */
export const EditorContext = createContext(null);
export const useEditor = () => useContext(EditorContext);

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Reads what the owner typed, keeping line breaks (Enter makes <div>/<br> in an editable). */
function readText(el) {
  let out = '';
  const walk = (node) => {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) out += c.data;
      else if (c.nodeName === 'BR') out += '\n';
      else {
        if (/^(DIV|P|LI)$/.test(c.nodeName) && out && !out.endsWith('\n')) out += '\n';
        walk(c);
      }
    }
  };
  walk(el);
  return out.replace(/ /g, ' ');
}

/* Text you click and type into, right where it appears on the page (Canva-style). */
export function EditableText({
  value,
  onChange,
  label,
  as: Tag = 'span',
  className = '',
  multiline = false,
  numeric = false,
  optional = false,
  placeholder,
  normalize,
  decorate,
}) {
  const ref = useRef(null);
  const editing = useRef(false);
  const shown = useRef(null);
  const text = value == null ? '' : String(value);

  // keep the text in sync with undo / redo, but never while the owner is typing.
  // `decorate` styles parts of it like the site does (e.g. italic second word).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || editing.current) return;
    if (decorate) {
      if (shown.current !== text || el.textContent !== text) el.innerHTML = decorate(escapeHtml(text));
    } else if (el.textContent !== text) el.textContent = text;
    shown.current = text;
  });

  const commit = () => {
    editing.current = false;
    const el = ref.current;
    let v = readText(el);
    v = multiline ? v.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : v.replace(/\s+/g, ' ').trim();
    if (numeric) {
      const n = parseInt(v.replace(/[^\d-]/g, ''), 10);
      v = Number.isFinite(n) ? n : value;
    } else if (normalize) v = normalize(v);
    const out = v == null ? '' : String(v);
    if (decorate) el.innerHTML = decorate(escapeHtml(out));
    else el.textContent = out;
    shown.current = out;
    if (v !== value) onChange(v);
  };

  return (
    <Tag className={`ed-field ${className}`} data-label={label}>
      <span
        ref={ref}
        className={`ed-text${optional ? ' is-optional' : ''}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        aria-multiline={multiline || undefined}
        inputMode={numeric ? 'numeric' : undefined}
        data-placeholder={placeholder ?? (label ? `Add ${label.toLowerCase()}` : 'Type here')}
        spellCheck
        onFocus={() => (editing.current = true)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            ref.current.textContent = text;
            ref.current.blur();
          } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            ref.current.blur();
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          const t = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, multiline ? t : t.replace(/\s+/g, ' '));
        }}
        onDrop={(e) => e.preventDefault()}
      />
    </Tag>
  );
}

/* Shows a photo from the live site, a fresh upload, or (just published, not deployed yet)
   straight from the repository. */
const remoteCache = new Map();
export function SmartImg({ path, large, alt = '', className = '' }) {
  const { resolveUpload, fetchImage } = useEditor();
  const pending = resolveUpload(path);
  const list = useMemo(() => (pending ? [pending] : imageCandidates(path, large)), [path, pending, large]);
  const [i, setI] = useState(0);
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    setI(0);
    setRemote(remoteCache.get(path) || null);
  }, [path, pending]);

  const onError = async () => {
    if (i + 1 < list.length) return setI(i + 1);
    if (!fetchImage || remote) return setRemote('missing');
    try {
      if (!remoteCache.has(path)) remoteCache.set(path, await fetchImage(path));
      setRemote(remoteCache.get(path));
    } catch {
      setRemote('missing');
    }
  };

  if (!path) return null;
  if (remote === 'missing') {
    return (
      <span className="ed-img-missing">
        <Icon name="image" /> Photo not found
      </span>
    );
  }
  return <img className={className} src={remote || list[i]} alt={alt} onError={onError} draggable={false} decoding="async" />;
}

/* A photo slot: hover → Replace, or drop a file from your computer onto it. */
export function EditableImage({ path, onChange, onRemove, label = 'photo', large, ratio, compact, className = '', children }) {
  const { addFiles, toast } = useEditor();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef(null);

  const take = async (files) => {
    const file = [...(files || [])][0];
    if (!file) return;
    setBusy(true);
    try {
      const [p] = await addFiles([file]);
      onChange(p);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`ed-photo${path ? '' : ' is-empty'}${over ? ' is-over' : ''}${compact ? ' is-compact' : ''} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      {path ? (
        <SmartImg path={path} large={large} alt={label} />
      ) : (
        <button type="button" className="ed-photo-empty" onClick={() => input.current.click()}>
          <Icon name="image" />
          <span>Add {label}</span>
          {!compact && <small>or drop a photo here</small>}
        </button>
      )}
      {path && (
        <div className="ed-photo-actions">
          <button type="button" onClick={() => input.current.click()} title={`Replace ${label}`} aria-label={`Replace ${label}`}>
            <Icon name="swap" />
            {!compact && <span>Replace</span>}
          </button>
          {onRemove && (
            <button type="button" className="is-danger" onClick={onRemove} title={`Remove ${label}`} aria-label={`Remove ${label}`}>
              <Icon name="trash" />
            </button>
          )}
        </div>
      )}
      {busy && (
        <div className="ed-photo-busy">
          <span className="ed-spinner" /> {compact ? '' : 'Preparing photo…'}
        </div>
      )}
      {over && <div className="ed-photo-drop">Drop to use this photo</div>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />
      {children}
    </div>
  );
}

/* "+ Add photos" tile: pick several at once, or drop them on it. */
export function AddPhotos({ onAdd, label = 'Add photos', compact, className = '', ratio }) {
  const { addFiles, toast } = useEditor();
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const take = async (files) => {
    const list = [...(files || [])];
    if (!list.length) return;
    setBusy(list.length);
    try {
      onAdd(await addFiles(list));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(0);
    }
  };
  return (
    <button
      type="button"
      className={`ed-add-photos${over ? ' is-over' : ''}${compact ? ' is-compact' : ''} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onClick={() => input.current.click()}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      {busy ? <span className="ed-spinner" /> : <Icon name="plus" />}
      <span>{busy ? `Preparing ${busy} photo${busy > 1 ? 's' : ''}…` : label}</span>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />
    </button>
  );
}

/* Small floating toolbar on a list item: move it, or delete it. */
export function ItemTools({ index, count, onMove, onRemove, vertical, removeLabel = 'Delete', confirmText, mini, children }) {
  const prev = vertical ? 'up' : 'left';
  const next = vertical ? 'down' : 'right';
  return (
    <div className={`ed-tools${mini ? ' is-mini' : ''}`} onMouseDown={(e) => e.preventDefault()}>
      {children}
      {onMove && (
        <>
          <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} title={vertical ? 'Move up' : 'Move left'} aria-label={vertical ? 'Move up' : 'Move left'}>
            <Icon name={prev} />
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(index + 1)} title={vertical ? 'Move down' : 'Move right'} aria-label={vertical ? 'Move down' : 'Move right'}>
            <Icon name={next} />
          </button>
        </>
      )}
      {onRemove && (
        <button
          type="button"
          className="is-danger"
          onClick={() => (!confirmText || window.confirm(confirmText)) && onRemove()}
          title={removeLabel}
          aria-label={removeLabel}
        >
          <Icon name="trash" />
        </button>
      )}
    </div>
  );
}

/* Drag-to-reorder for photo grids (files dropped from the computer are handled separately). */
export function useDragSort(onMove) {
  const [from, setFrom] = useState(null);
  const [overAt, setOverAt] = useState(null);
  return (i) => ({
    draggable: true,
    'data-dragging': from === i || undefined,
    'data-drop': overAt === i && from !== null && from !== i ? true : undefined,
    onDragStart: (e) => {
      setFrom(i);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/x-editor-index', String(i));
    },
    onDragEnd: () => {
      setFrom(null);
      setOverAt(null);
    },
    onDragOver: (e) => {
      if (from === null) return;
      e.preventDefault();
      setOverAt(i);
    },
    onDrop: (e) => {
      if (from === null) return;
      e.preventDefault();
      onMove(from, i);
      setFrom(null);
      setOverAt(null);
    },
  });
}

/* Section heading styled like the site's "(02) — SELECTED WORK ———— 01/06" rows. */
export function SecHead({ n, title, children, light }) {
  return (
    <div className={`ed-sec-head${light ? ' is-light' : ''}`}>
      <span className="ed-idx">({n})</span>
      <span>{title}</span>
      <span className="ed-rule" />
      <span className="ed-sec-right">{children}</span>
    </div>
  );
}

export const pad = (n) => String(n).padStart(2, '0');
