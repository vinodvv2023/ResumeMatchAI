import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
const ak = process.env.VITE_BLAXEL_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : String(path || '');
  const url = `${backendUrl}/${pathStr}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  const ct = req.headers['content-type'];
  if (ct) headers['Content-Type'] = ct;

  if (ak && ws) {
    headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    headers['X-Blaxel-Workspace'] = ws;
  }

  const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? JSON.stringify(req.body) : undefined;

  try {
    const fetchRes = await fetch(url, { method: req.method, headers, body, redirect: 'follow' });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
