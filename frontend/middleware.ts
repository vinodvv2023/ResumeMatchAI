export const config = {
  matcher: ['/api/:path*'],
};

export default async function middleware(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const backendUrl = (process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const path = url.pathname.replace(/^\/api\/?/, '');
  const search = url.search || '';
  const backendTarget = `${backendUrl}/${path}${search}`;

  const headers: Record<string, string> = {};
  if (req.headers.get('content-type')) {
    headers['Content-Type'] = req.headers.get('content-type');
  }
  headers['Accept'] = 'application/json';

  const blaxelWorkspace = process.env.VITE_BLAXEL_WORKSPACE || '';
  const blaxelApiKey = process.env.VITE_BLAXEL_API_KEY || '';

  if (blaxelApiKey && blaxelWorkspace) {
    headers['X-Blaxel-Authorization'] = `Bearer ${blaxelApiKey}`;
    headers['X-Blaxel-Workspace'] = blaxelWorkspace;
  }

  try {
    const response = await fetch(backendTarget, {
      method: req.method,
      headers,
      redirect: 'follow',
    });

    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
    };
    const ct = response.headers.get('content-type');
    if (ct) responseHeaders['Content-Type'] = ct;

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? `${error.message}` : 'Proxy error';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
