// Loading and publishing content.
//  · github: the live editor. Signs in through this site's /api/auth (Vercel function),
//    reads the JSON files from the repository and publishes every change as ONE commit;
//    Vercel then redeploys the site automatically.
//  · local:  `npm run dev` on your computer. Saves straight to the files on disk
//    (dev-only endpoints in client/scripts/editor-api.mjs).
import { BRANCH, FILES, REPO, UPLOAD_DIR } from './config';

const API = 'https://api.github.com';
const RAW = 'application/vnd.github.raw';
const TOKEN_KEY = 'arv-editor:github-token';

export class EditorError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const storedToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};
export const storeToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: stays signed in for this tab only */
  }
};

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

const base64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');

// git's id for a file, so we know the new version without asking GitHub again
async function gitBlobSha(text) {
  const body = new TextEncoder().encode(text);
  const head = new TextEncoder().encode(`blob ${body.length}\0`);
  const all = new Uint8Array(head.length + body.length);
  all.set(head);
  all.set(body, head.length);
  const hash = await crypto.subtle.digest('SHA-1', all);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- sign in (same popup handshake as /api/callback speaks) ---------- */
export function signInWithGitHub() {
  return new Promise((resolve, reject) => {
    const w = 600;
    const h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 3);
    const popup = window.open('/api/auth?provider=github', 'github-sign-in', `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup) return reject(new EditorError('Your browser blocked the sign-in window. Allow pop-ups for this site and try again.'));

    const done = (fn, arg) => {
      window.removeEventListener('message', onMessage);
      clearInterval(timer);
      try {
        popup.close();
      } catch {
        /* already closed */
      }
      fn(arg);
    };
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') return popup.postMessage(e.data, e.origin);
      const m = e.data.match(/^authorization:github:(success|error):([\s\S]*)$/);
      if (!m) return;
      let payload = {};
      try {
        payload = JSON.parse(m[2]);
      } catch {
        /* keep empty */
      }
      if (m[1] === 'success' && payload.token) done(resolve, payload.token);
      else done(reject, new EditorError(payload.message || 'GitHub sign-in failed.'));
    };
    window.addEventListener('message', onMessage);
    const timer = setInterval(() => {
      if (popup.closed) done(reject, new EditorError('The sign-in window was closed.', { code: 'closed' }));
    }, 600);
  });
}

/* ---------- GitHub (live site) ---------- */
export function githubBackend(token) {
  const repo = `/repos/${REPO}`;
  const call = async (path, { method = 'GET', body, accept } = {}) => {
    let r;
    try {
      r = await fetch(`${API}${path}`, {
        method,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: accept || 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new EditorError('Could not reach GitHub. Check your internet connection and try again.', { code: 'offline' });
    }
    if (!r.ok) {
      let msg = `GitHub said: ${r.status}`;
      try {
        msg = (await r.json()).message || msg;
      } catch {
        /* not json */
      }
      if (r.status === 401) throw new EditorError('Your sign-in has expired. Please sign in again.', { status: 401, code: 'auth' });
      throw new EditorError(msg, { status: r.status });
    }
    return accept === RAW ? r.blob() : r.json();
  };

  return {
    mode: 'github',
    async whoami() {
      const user = await call('/user');
      const noAccess = new EditorError(
        `The GitHub account “${user.login}” can’t edit this website. Sign in with the account that owns it, or ask the owner to add you as a collaborator on ${REPO}.`,
        { status: 403, code: 'no-access' }
      );
      let info;
      try {
        info = await call(repo);
      } catch (e) {
        if (e.status === 404 || e.status === 403) throw noAccess;
        throw e;
      }
      if (!info.permissions?.push) throw noAccess;
      return { login: user.login, name: user.name || user.login, avatar: user.avatar_url };
    },
    async load() {
      const data = {};
      const shas = {};
      await Promise.all(
        Object.entries(FILES).map(async ([key, path]) => {
          try {
            const f = await call(`${repo}/contents/${encodePath(path)}?ref=${BRANCH}`);
            data[key] = JSON.parse(base64ToText(f.content));
            shas[key] = f.sha;
          } catch (e) {
            if (e.status !== 404) throw e;
            data[key] = {}; // file not created yet (e.g. a newer section): Publish creates it
            shas[key] = null;
          }
        })
      );
      return { data, shas };
    },
    // changed: { key: json text }, uploads: [{ name, blob }], shas: the versions we loaded
    async publish({ changed, uploads, shas, force, message }) {
      const ref = await call(`${repo}/git/ref/heads/${BRANCH}`);
      const headSha = ref.object.sha;
      if (!force) {
        for (const key of Object.keys(changed)) {
          let current = null;
          try {
            current = (await call(`${repo}/contents/${encodePath(FILES[key])}?ref=${headSha}`)).sha;
          } catch (e) {
            if (e.status !== 404) throw e;
          }
          if (current !== shas[key]) {
            throw new EditorError('This content was changed somewhere else (another device or tab) after you opened the editor.', { code: 'conflict' });
          }
        }
      }
      const head = await call(`${repo}/git/commits/${headSha}`);
      const tree = [];
      for (const u of uploads) {
        const blob = await call(`${repo}/git/blobs`, { method: 'POST', body: { content: await blobToBase64(u.blob), encoding: 'base64' } });
        tree.push({ path: UPLOAD_DIR + u.name, mode: '100644', type: 'blob', sha: blob.sha });
      }
      for (const [key, text] of Object.entries(changed)) tree.push({ path: FILES[key], mode: '100644', type: 'blob', content: text });
      const newTree = await call(`${repo}/git/trees`, { method: 'POST', body: { base_tree: head.tree.sha, tree } });
      const commit = await call(`${repo}/git/commits`, { method: 'POST', body: { message, tree: newTree.sha, parents: [headSha] } });
      try {
        await call(`${repo}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha } });
      } catch (e) {
        if (e.status === 422) throw new EditorError('Someone published at the same moment. Please press Publish again.', { code: 'moved' });
        throw e;
      }
      const newShas = {};
      for (const [key, text] of Object.entries(changed)) newShas[key] = await gitBlobSha(text);
      return { shas: newShas };
    },
    // photos that are already in the repository but not on the live site yet (deploy pending)
    async fetchImage(urlPath) {
      const blob = await call(`${repo}/contents/${encodePath(`client/public${urlPath}`)}?ref=${BRANCH}`, { accept: RAW });
      return URL.createObjectURL(blob);
    },
  };
}

/* ---------- this computer (npm run dev) ---------- */
export function localBackend() {
  return {
    mode: 'local',
    async whoami() {
      return { login: 'local', name: 'This computer' };
    },
    async load() {
      let r;
      try {
        r = await fetch('/__editor/content', { cache: 'no-store' });
      } catch {
        r = null;
      }
      if (!r || !r.ok) {
        throw new EditorError('To edit on this computer, start the site with “npm run dev” and open http://localhost:5173/admin/');
      }
      return { data: await r.json(), shas: {} };
    },
    async publish({ changed, uploads }) {
      const body = {
        files: changed,
        uploads: await Promise.all(uploads.map(async (u) => ({ name: u.name, base64: await blobToBase64(u.blob) }))),
      };
      const r = await fetch('/__editor/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || !res.ok) throw new EditorError(res.error || 'Could not save the files.');
      return { shas: {} };
    },
    fetchImage: null,
  };
}
