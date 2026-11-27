// Editor state: the content being edited, the last published version, and undo history.

export const toJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[k] = setIn(obj?.[k], rest, value);
  return copy;
}

export const getIn = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);

export const moveItem = (arr, from, to) => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};
export const removeItem = (arr, i) => arr.filter((_, j) => j !== i);

const HISTORY = 100;

export const initialState = { data: null, saved: null, past: [], future: [] };

export function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { data: action.data, saved: action.data, past: [], future: [] };
    case 'edit': {
      const data = action.fn(state.data);
      if (data === state.data || toJson(data) === toJson(state.data)) return state;
      return { ...state, data, past: [...state.past.slice(-HISTORY), state.data], future: [] };
    }
    case 'undo':
      if (!state.past.length) return state;
      return { ...state, data: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.data, ...state.future] };
    case 'redo':
      if (!state.future.length) return state;
      return { ...state, data: state.future[0], past: [...state.past, state.data], future: state.future.slice(1) };
    case 'discard':
      return { ...state, data: state.saved, past: [...state.past, state.data], future: [] };
    case 'published':
      return { ...state, saved: action.data };
    default:
      return state;
  }
}

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj?.[k]]));

// What each sidebar section edits (used for "unpublished changes" dots).
export const SECTION_SLICES = {
  opening: (d) => pick(d.profile, ['brand', 'brandShort', 'role']),
  portrait: (d) => pick(d.profile, ['portrait', 'portraitCaption', 'greeting', 'name', 'lede']),
  about: (d) => pick(d.profile, ['statement', 'since', 'stats', 'aboutImage', 'aboutImageAlt', 'kit']),
  work: (d) => d.projects,
  films: (d) => d.videos,
  sheet: (d) => d.sheet,
  services: (d) => d.services,
  contact: (d) => pick(d.profile, ['availability', 'email', 'socials', 'name']),
};

// Things that would break the site if published; each points at the section to fix.
export function problems(data) {
  const out = [];
  const p = data.profile;
  if (!p.name?.trim()) out.push({ section: 'portrait', msg: 'Your name is empty.' });
  if (!p.brand?.trim()) out.push({ section: 'opening', msg: 'The studio name is empty.' });
  if (!p.portrait) out.push({ section: 'portrait', msg: 'Add your portrait photo.' });
  if (!p.aboutImage) out.push({ section: 'about', msg: 'Add the About photo.' });
  const projects = data.projects.projects || [];
  if (!projects.length) out.push({ section: 'work', msg: 'Add at least one project.' });
  projects.forEach((x, i) => {
    const name = x.title?.trim() || `Project ${i + 1}`;
    if (!x.title?.trim()) out.push({ section: 'work', msg: `Project ${i + 1} needs a title.` });
    if (!x.cover) out.push({ section: 'work', msg: `“${name}” needs a cover photo.` });
  });
  (data.videos?.videos || []).forEach((v, i) => {
    if (!v.title?.trim()) out.push({ section: 'films', msg: `Video ${i + 1} needs a title.` });
  });
  if (!(data.sheet.frames || []).length) out.push({ section: 'sheet', msg: 'The contact sheet needs at least one photo.' });
  (data.services.services || []).forEach((s, i) => {
    if (!s.image) out.push({ section: 'services', msg: `“${s.title || `Service ${i + 1}`}” needs a photo.` });
  });
  return out;
}
