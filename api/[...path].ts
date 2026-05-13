import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
const ak = process.env.VITE_BLAXEL_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = req.query.path;
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join('/') : String(pathSegments || '');
  const url = `${backendUrl}/${pathStr}${req.url?.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : ''}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const ct = req.headers['content-type'];
  if (ct && typeof ct === 'string') headers['Content-Type'] = ct;

  if (ak && ws) {
    headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    headers['X-Blaxel-Workspace'] = ws;
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method || '');
  const body = hasBody ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined;

  try {
    const fetchRes = await fetch(url, { method: req.method || 'GET', headers, body, redirect: 'follow' });
    const contentType = fetchRes.headers.get('content-type') || 'application/json';
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', contentType).send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
