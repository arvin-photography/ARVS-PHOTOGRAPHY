import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Icon from './components/Icon';
import { EditorContext } from './components/Editable';
import { IS_LOCAL } from './lib/config';
import { githubBackend, localBackend, signInWithGitHub, storeToken, storedToken } from './lib/backend';
import { prepareUpload } from './lib/images';
import { SECTION_SLICES, getIn, initialState, problems, reducer, setIn, toJson } from './lib/store';
import Opening from './sections/Opening';
import Portrait from './sections/Portrait';
import About from './sections/About';
import Work from './sections/Work';
import Sheet from './sections/Sheet';
import Services from './sections/Services';
import Contact from './sections/Contact';

const SECTIONS = [
  { id: 'opening', n: '01', title: 'Opening', desc: 'Studio name and tagline', Comp: Opening, tip: 'The first screen visitors see: your studio name over the 3D camera. The red scroll badge invites them to scroll.' },
  { id: 'portrait', n: '02', title: 'Portrait', desc: 'Your photo, name and intro', Comp: Portrait, tip: 'After the camera “takes the shot”, this print of you develops on screen.' },
  { id: 'about', n: '03', title: 'About', desc: 'Your story, numbers, kit', Comp: About, tip: 'Your statement, the big numbers, the photo and what is in your bag.' },
  { id: 'work', n: '04', title: 'Selected work', desc: 'Heading, projects, photos', Comp: Work, tip: 'The heading, then each film frame is a project. Its series photos open when a visitor clicks it.' },
  { id: 'sheet', n: '05', title: 'Contact sheet', desc: 'Heading and photo grid', Comp: Sheet, tip: 'The heading and a grid of single frames. Drag to reorder, or drop several photos on “Add photos”.' },
  { id: 'services', n: '06', title: 'Services', desc: 'What you offer', Comp: Services, tip: 'The scrolling words and the list of services, each with a photo shown on hover.' },
  { id: 'contact', n: '07', title: 'Contact & footer', desc: 'Availability, email, links', Comp: Contact, tip: 'How people reach you. The contact form itself is automatic.' },
];
const KEYS = ['profile', 'projects', 'sheet', 'services'];

const initialSection = () => {
  const id = window.location.hash.replace('#', '');
  return SECTIONS.some((s) => s.id === id) ? id : 'opening';
};

export default function App() {
  const [phase, setPhase] = useState('boot'); // boot | signin | loading | ready | error
  const [error, setError] = useState('');
  const [backend, setBackend] = useState(null);
  const [user, setUser] = useState(null);
  const [shas, setShas] = useState({});
  const [state, dispatch] = useReducer(reducer, initialState);
  const [section, setSection] = useState(initialSection);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [toasts, setToasts] = useState([]);
  const uploads = useRef(new Map()); // path → { name, blob, url } not published yet
  const main = useRef(null);

  const toast = useCallback((msg, kind = 'info') => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 4500);
  }, []);

  /* ---------- sign in + load ---------- */
  const open = useCallback(async (b) => {
    setPhase('loading');
    try {
      const who = await b.whoami();
      const { data, shas: s } = await b.load();
      setBackend(b);
      setUser(who);
      setShas(s);
      dispatch({ type: 'load', data });
      setPhase('ready');
    } catch (e) {
      if (b.mode === 'github' && (e.code === 'auth' || e.code === 'no-access')) {
        storeToken('');
        setError(e.message);
        setPhase('signin');
      } else {
        setError(e.message);
        setPhase('error');
      }
    }
  }, []);

  useEffect(() => {
    if (IS_LOCAL) open(localBackend());
    else if (storedToken()) open(githubBackend(storedToken()));
    else setPhase('signin');
  }, [open]);

  const signIn = async () => {
    setError('');
    try {
      const token = await signInWithGitHub();
      storeToken(token);
      if (phase === 'ready') {
        // signed in again mid-session (expired): keep every unpublished edit
        setBackend(githubBackend(token));
        toast('Signed in again. Press Publish to try once more.');
      } else open(githubBackend(token));
    } catch (e) {
      if (e.code !== 'closed') setError(e.message);
    }
  };

  const signOut = () => {
    if (dirty && !window.confirm('You have unpublished changes. Sign out and lose them?')) return;
    storeToken('');
    window.location.reload();
  };

  /* ---------- editing ---------- */
  const set = useCallback((path, value) => dispatch({ type: 'edit', fn: (d) => setIn(d, path, value) }), []);
  const update = useCallback((path, fn) => dispatch({ type: 'edit', fn: (d) => setIn(d, path, fn(getIn(d, path))) }), []);

  const editor = useMemo(
    () => ({
      toast,
      resolveUpload: (path) => uploads.current.get(path)?.url,
      fetchImage: backend?.fetchImage || null,
      addFiles: async (files) => {
        const out = [];
        for (const file of files) {
          const u = await prepareUpload(file);
          uploads.current.set(u.path, u);
          out.push(u.path);
        }
        return out;
      },
    }),
    [backend, toast]
  );

  const changedKeys = useMemo(
    () => (state.data ? KEYS.filter((k) => toJson(state.data[k]) !== toJson(state.saved[k])) : []),
    [state.data, state.saved]
  );
  const dirty = changedKeys.length > 0;
  const dirtySections = useMemo(
    () => (state.data ? SECTIONS.filter((s) => toJson(SECTION_SLICES[s.id](state.data)) !== toJson(SECTION_SLICES[s.id](state.saved))).map((s) => s.id) : []),
    [state.data, state.saved]
  );

  useEffect(() => {
    if (dirty) setPublished(false);
  }, [dirty]);

  // warn before leaving with unpublished changes
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Ctrl/Cmd+Z, Ctrl+Shift+Z / Ctrl+Y (typing in a text keeps its own undo)
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || document.activeElement?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) dispatch({ type: 'undo' });
      else if ((k === 'z' && e.shiftKey) || k === 'y') dispatch({ type: 'redo' });
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (id) => {
    document.activeElement?.blur?.();
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    setSection(id);
    main.current?.scrollTo({ top: 0 });
  };

  // browser Back / Forward (and links like /admin/#work) switch sections
  useEffect(() => {
    const onHash = () => setSection(initialSection());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);

  /* ---------- publish ---------- */
  const publish = async (force = false) => {
    document.activeElement?.blur?.(); // save the text being typed first
    await new Promise((r) => setTimeout(r, 0));
    setConflict(false);
    const data = stateRef.current.data;
    const saved = stateRef.current.saved;
    const issues = problems(data);
    if (issues.length) {
      go(issues[0].section);
      toast(`Before publishing: ${issues[0].msg}${issues.length > 1 ? ` (and ${issues.length - 1} more)` : ''}`, 'error');
      return;
    }
    const changed = {};
    for (const k of KEYS) if (toJson(data[k]) !== toJson(saved[k])) changed[k] = toJson(data[k]);
    if (!Object.keys(changed).length) return;
    const text = Object.values(changed).join('');
    const newUploads = [...uploads.current.values()].filter((u) => text.includes(u.path));
    const names = SECTIONS.filter((s) => toJson(SECTION_SLICES[s.id](data)) !== toJson(SECTION_SLICES[s.id](saved))).map((s) => s.title);

    setPublishing(true);
    try {
      const res = await backend.publish({
        changed,
        uploads: newUploads,
        shas,
        force,
        message: `Content: update ${names.join(', ').toLowerCase()}${newUploads.length ? ` (+${newUploads.length} photo${newUploads.length > 1 ? 's' : ''})` : ''}`,
      });
      setShas((s) => ({ ...s, ...res.shas }));
      dispatch({ type: 'published', data });
      setPublished(true);
      toast(backend.mode === 'local' ? 'Saved to the files on this computer.' : 'Published! The live site updates in about a minute.', 'success');
    } catch (e) {
      if (e.code === 'conflict') setConflict(true);
      else if (e.code === 'auth') {
        storeToken('');
        toast('Your sign-in expired. Click “Sign in again” — your changes are kept.', 'error');
        setBackend((b) => ({ ...b, expired: true }));
      } else toast(e.message, 'error');
    } finally {
      setPublishing(false);
    }
  };
  const stateRef = useRef(state);
  stateRef.current = state;

  const reloadLatest = () => {
    setConflict(false);
    open(backend);
  };

  /* ---------- screens ---------- */
  if (phase === 'boot' || phase === 'loading') {
    return (
      <div className="ed-screen">
        <span className="ed-spinner is-big" />
        <p>Opening your portfolio…</p>
      </div>
    );
  }
  if (phase === 'signin') {
    return (
      <div className="ed-screen">
        <div className="ed-signin">
          <span className="ed-brandmark">
            <i className="ed-dot" /> Portfolio editor
          </span>
          <h1>
            Edit your <em>portfolio.</em>
          </h1>
          <p>Change your photos and words right on the page, then press Publish. The website updates by itself about a minute later.</p>
          <button type="button" className="ed-btn is-primary is-big" onClick={signIn}>
            <Icon name="github" /> Sign in with GitHub
          </button>
          <small>Use the GitHub account that owns the website.</small>
          {error && <p className="ed-error">{error}</p>}
        </div>
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className="ed-screen">
        <div className="ed-signin">
          <h1>Something went wrong</h1>
          <p className="ed-error">{error}</p>
          <button type="button" className="ed-btn is-primary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const current = SECTIONS.find((s) => s.id === section);
  const Comp = current.Comp;
  const expired = backend?.expired;

  let status;
  if (publishing) status = { kind: 'busy', text: IS_LOCAL ? 'Saving…' : 'Publishing…' };
  else if (dirty) status = { kind: 'dirty', text: `Unpublished changes in ${dirtySections.length || 1} section${dirtySections.length > 1 ? 's' : ''}` };
  else if (published) status = { kind: 'ok', text: IS_LOCAL ? 'Saved' : 'Published — live in about a minute' };
  else status = { kind: 'ok', text: IS_LOCAL ? 'Everything is saved' : 'Everything is live' };

  return (
    <EditorContext.Provider value={editor}>
      <div className="ed-app">
        <header className="ed-top">
          <span className="ed-brandmark">
            <i className="ed-dot" />
            <span>
              Portfolio editor{IS_LOCAL && <em className="ed-local"> · this computer</em>}
            </span>
          </span>

          <span className={`ed-status is-${status.kind}`} role="status">
            {status.kind === 'busy' ? <span className="ed-spinner" /> : <i />}
            {status.text}
          </span>

          <div className="ed-top-actions">
            <button type="button" className="ed-icon-btn" onClick={() => dispatch({ type: 'undo' })} disabled={!state.past.length} title="Undo (Ctrl+Z)" aria-label="Undo">
              <Icon name="undo" />
            </button>
            <button type="button" className="ed-icon-btn" onClick={() => dispatch({ type: 'redo' })} disabled={!state.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
              <Icon name="redo" />
            </button>
            {dirty && (
              <button
                type="button"
                className="ed-btn is-ghost ed-hide-sm"
                onClick={() => window.confirm('Throw away all unpublished changes?') && dispatch({ type: 'discard' })}
              >
                Discard
              </button>
            )}
            <a className="ed-btn is-ghost ed-hide-sm" href="/" target="_blank" rel="noreferrer">
              <Icon name="eye" /> View site
            </a>
            {expired ? (
              <button type="button" className="ed-btn is-primary" onClick={signIn}>
                <Icon name="github" /> Sign in again
              </button>
            ) : (
              <button type="button" className="ed-btn is-primary" onClick={() => publish(false)} disabled={!dirty || publishing}>
                {publishing ? <span className="ed-spinner" /> : <Icon name="check" />}
                {IS_LOCAL ? 'Save' : 'Publish'}
              </button>
            )}
            {user?.avatar ? (
              <button type="button" className="ed-avatar" onClick={signOut} title={`Signed in as ${user.login} — click to sign out`}>
                <img src={user.avatar} alt="" />
              </button>
            ) : null}
          </div>
        </header>

        <nav className="ed-side" aria-label="Sections">
          <p className="ed-side-title">Sections of your site</p>
          {SECTIONS.map((s) => (
            <button type="button" key={s.id} className={`ed-side-item${s.id === section ? ' is-active' : ''}`} onClick={() => go(s.id)} aria-current={s.id === section ? 'page' : undefined}>
              <span className="ed-side-n">{s.n}</span>
              <span className="ed-side-text">
                <strong>{s.title}</strong>
                <small>{s.desc}</small>
              </span>
              {dirtySections.includes(s.id) && <i className="ed-side-dirty" title="Unpublished changes" />}
            </button>
          ))}
          <div className="ed-help">
            <p>
              <Icon name="info" size={16} /> <strong>How to edit</strong>
            </p>
            <ul>
              <li>Click any text and type.</li>
              <li>Hover a photo → <b>Replace</b>, or drop a photo from your computer on it.</li>
              <li>Use the small buttons on an item to move or delete it.</li>
              <li>
                Nothing goes live until you press <b>{IS_LOCAL ? 'Save' : 'Publish'}</b>.
              </li>
            </ul>
          </div>
        </nav>

        <main className="ed-main" ref={main}>
          <div className="ed-main-head">
            <div>
              <span className="ed-main-n">{current.n}</span>
              <h1>{current.title}</h1>
              <p>{current.tip}</p>
            </div>
          </div>
          <div className="ed-canvas" key={section}>
            <Comp data={state.data} set={set} update={update} />
          </div>
          <div className="ed-pager">
            {SECTIONS.indexOf(current) > 0 && (
              <button type="button" className="ed-btn is-ghost" onClick={() => go(SECTIONS[SECTIONS.indexOf(current) - 1].id)}>
                <Icon name="left" /> {SECTIONS[SECTIONS.indexOf(current) - 1].title}
              </button>
            )}
            <span />
            {SECTIONS.indexOf(current) < SECTIONS.length - 1 && (
              <button type="button" className="ed-btn is-ghost" onClick={() => go(SECTIONS[SECTIONS.indexOf(current) + 1].id)}>
                {SECTIONS[SECTIONS.indexOf(current) + 1].title} <Icon name="right" />
              </button>
            )}
          </div>
        </main>

        {conflict && (
          <div className="ed-modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
            <div className="ed-modal-box">
              <h2 id="conflict-title">The site was changed somewhere else</h2>
              <p>Someone (maybe you, on another device or tab) published changes after you opened this editor.</p>
              <div className="ed-modal-actions">
                <button type="button" className="ed-btn is-ghost" onClick={reloadLatest}>
                  Load the latest version
                  <small>your unpublished edits here are dropped</small>
                </button>
                <button type="button" className="ed-btn is-primary" onClick={() => publish(true)}>
                  Publish mine anyway
                  <small>replaces those changes in the sections you edited</small>
                </button>
              </div>
              <button type="button" className="ed-modal-close" onClick={() => setConflict(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}

        <div className="ed-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`ed-toast is-${t.kind}`}>
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </EditorContext.Provider>
  );
}

