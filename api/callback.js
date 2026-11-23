// Vercel function: GET /api/callback
// Step 2 of the /admin (Decap CMS) GitHub login: GitHub sends the owner back here with a
// one-time code; we swap it for an access token and hand it to the admin window that
// opened this popup (Decap's "authorization:github:…" postMessage handshake).

const readCookie = (req, name) => {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
};

// JSON that is safe to place inside a <script> tag
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

function reply(res, origin, status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', 'decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.end(`<!doctype html><html><body><p>${status === 'success' ? 'Signed in, you can close this window.' : 'Sign-in failed.'}</p>
<script>
(function () {
  var origin = ${js(origin)};
  var message = ${js(message)};
  if (!window.opener) return;
  // Decap answers "authorizing:github" from the admin page; only then send the token,
  // and only to this site's own origin.
  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(message, origin);
  }, false);
  window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`);
}

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const query = new URL(req.url, origin).searchParams;
  const code = query.get('code');
  const state = query.get('state');

  if (query.get('error')) return reply(res, origin, 'error', { message: query.get('error_description') || query.get('error') });
  if (!code) return reply(res, origin, 'error', { message: 'Missing code from GitHub.' });
  if (!state || state !== readCookie(req, 'decap_oauth_state')) {
    return reply(res, origin, 'error', { message: 'Login expired or was started elsewhere. Please try again.' });
  }

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
        client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    });
    const data = await r.json();
    if (!data.access_token) throw new Error(data.error_description || data.error || 'GitHub did not return a token.');
    return reply(res, origin, 'success', { token: data.access_token, provider: 'github' });
  } catch (err) {
    return reply(res, origin, 'error', { message: err.message });
  }
};
