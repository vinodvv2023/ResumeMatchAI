export const config = {
  matcher: ['/api/:path*'],
};

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const backendUrl = (process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const path = url.pathname.replace(/^\/api\/?/, '');
  const search = url.search || '';
  const backendTarget = `${backendUrl}/${path}${search}`;

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('content-type') || 'application/json');
  headers.set('Accept', 'application/json');

  const blaxelWorkspace = process.env.VITE_BLAXEL_WORKSPACE || '';
  const blaxelApiKey = process.env.VITE_BLAXEL_API_KEY || '';

  if (blaxelApiKey && blaxelWorkspace) {
    headers.set('X-Blaxel-Authorization', `Bearer ${blaxelApiKey}`);
    headers.set('X-Blaxel-Workspace', blaxelWorkspace);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = req.body;
  }

  try {
    const response = await fetch(backendTarget, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
