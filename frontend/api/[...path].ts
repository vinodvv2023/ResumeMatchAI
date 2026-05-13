import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
const ak = process.env.VITE_BLAXEL_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const incomingPath = req.url || '/';
  const stripped = incomingPath.replace(/^\/api\/?/, '');
  const url = `${backendUrl}/${stripped}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const ct = req.headers['content-type'];
  if (ct && typeof ct === 'string') headers['Content-Type'] = ct;
  if (ak && ws) {
    headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    headers['X-Blaxel-Workspace'] = ws;
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method || '');
  let body: string | undefined;
  if (hasBody && req.body != null) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const fetchRes = await fetch(url, { method: req.method || 'GET', headers, body, redirect: 'follow' });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
