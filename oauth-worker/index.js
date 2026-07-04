// Salesian College CMS OAuth Proxy
// Handles GitHub OAuth server-side so the client secret never touches the browser.
// Deploy this as a separate Cloudflare Worker named "salesian-oauth".
// Set environment secret: GITHUB_CLIENT_SECRET = your GitHub OAuth App client secret

const GITHUB_CLIENT_ID = 'Ov23li4pIovpC3rhHqUu';
const SCOPE = 'repo,user';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1 — CMS opens this in a popup, we redirect to GitHub login
    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: SCOPE,
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302
      );
    }

    // Step 2 — GitHub redirects here with a code, we exchange it for a token
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code', { status: 400 });
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`GitHub auth error: ${tokenData.error_description}`, { status: 400 });
      }

      // Step 3 — Post token back to the CMS popup opener
      const token = JSON.stringify(tokenData.access_token);
      const html = `<!DOCTYPE html><html><body><script>
(function () {
  var token = ${token};
  var msg = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });
  function receive(e) {
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', '*');
})();
<\/script></body></html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
