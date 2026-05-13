export default async function handler(req) {
  const target = new URL(req.url);
  const backendUrl = (process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  const path = target.pathname.replace(/^\/api\/proxy/, '');
  const backendTarget = `${backendUrl}${path}${target.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');

  const blaxelWorkspace = process.env.VITE_BLAXEL_WORKSPACE || '';
  const blaxelApiKey = process.env.VITE_BLAXEL_API_KEY || '';

  if (blaxelApiKey && blaxelWorkspace) {
    headers.set('X-Blaxel-Authorization', `Bearer ${blaxelApiKey}`);
    headers.set('X-Blaxel-Workspace', blaxelWorkspace);
  }

  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    fetchOptions.body = await req.text();
  }

  try {
    const response = await fetch(backendTarget, fetchOptions);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Blaxel-Authorization, X-Blaxel-Workspace');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
