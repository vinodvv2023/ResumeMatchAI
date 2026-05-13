export const config = {
  matcher: ["/api/:path*"],
};

export default async function middleware(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const backendUrl = (process.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
    const path = url.pathname.replace(/^\/api\/?/, "").replace(/^\//, "");
    const search = url.search || "";
    const backendTarget = `${backendUrl}/${path}${search}`;

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    const ct = req.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;

    const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
    const ak = process.env.VITE_BLAXEL_API_KEY || '';
    if (ak && ws) {
      headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
      headers['X-Blaxel-Workspace'] = ws;
    }

    let body: BodyInit | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = await req.text();
      if (!body) body = undefined;
    }

    const response = await fetch(backendTarget, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    });
    const rh: Record<string, string> = { 'Access-Control-Allow-Origin': '*' };
    const rct = response.headers.get('content-type');
    if (rct) rh['Content-Type'] = rct;

    return new Response(response.body, { status: response.status, headers: rh });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
