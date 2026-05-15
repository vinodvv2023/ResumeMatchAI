import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
const ak = process.env.VITE_BLAXEL_API_KEY || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req: import('stream').Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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

  let body: Uint8Array | string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    const raw = await getRawBody(req as unknown as import('stream').Readable);
    body = new Uint8Array(raw);
    headers['Content-Length'] = String(raw.length);
  }

  try {
    const fetchRes = await fetch(url, { method: req.method || 'GET', headers, body, redirect: 'follow' });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
