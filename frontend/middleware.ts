import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/api/:path*'],
};

export async function middleware(req: NextRequest) {
  const backendUrl = (process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const path = req.nextUrl.pathname.replace(/^\/api\/?/, '');
  const search = req.nextUrl.search;
  const backendTarget = `${backendUrl}/${path}${search}`;

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('content-type') || 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('x-forwarded-for', req.headers.get('x-forwarded-for') || '');
  headers.set('x-forwarded-host', req.headers.get('x-forwarded-host') || '');

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

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
