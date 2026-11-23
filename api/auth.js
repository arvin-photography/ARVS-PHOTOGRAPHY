// Vercel function: GET /api/auth
// Step 1 of the /admin editor's GitHub login: sends the owner to GitHub to approve.
// Needs the env vars OAUTH_GITHUB_CLIENT_ID + OAUTH_GITHUB_CLIENT_SECRET (see DEPLOY.md).
const crypto = require('node:crypto');

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('GitHub login is not set up yet: add OAUTH_GITHUB_CLIENT_ID and OAUTH_GITHUB_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy.');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const state = crypto.randomBytes(16).toString('hex');

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${proto}://${host}/api/callback`);
  url.searchParams.set('scope', 'repo,user'); // write access to the content in the repository
  url.searchParams.set('state', state);

  // the callback checks this, so nobody else can complete a login started elsewhere
  res.setHeader('Set-Cookie', `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader('Location', url.toString());
  res.end();
};
