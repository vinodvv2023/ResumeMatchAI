import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
const ak = process.env.VITE_BLAXEL_API_KEY || '';

export const config = {
  api: {
    bodyParser: false,
    bodySizeLimit: '10mb',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const incomingPath = req.url || '/';
  const stripped = incomingPath.replace(/^\/api\/?/, '');
  const url = `${backendUrl}/${stripped}`;

  const ct = req.headers['content-type'] || '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (ct) headers['Content-Type'] = ct;
  if (ak && ws) {
    headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    headers['X-Blaxel-Workspace'] = ws;
  }

  let body: import('stream').Readable | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    body = req as unknown as import('stream').Readable;
  }

  try {
    const fetchRes = await fetch(url, { method: req.method || 'GET', headers, body, duplex: 'half', redirect: 'follow' });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
