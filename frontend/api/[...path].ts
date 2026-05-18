import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
    bodySizeLimit: '10mb',
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
  const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
  const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
  const ak = process.env.VITE_BLAXEL_API_KEY || '';

  const incomingPath = req.url || '/';
  const stripped = incomingPath.replace(/^\/api\/?/, '').split('?')[0];
  const url = `${backendUrl}/${stripped}`;

  const rawAuth = req.headers['authorization'];
  const authValue = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const ct = req.headers['content-type'] || '';
  if (ct) headers['Content-Type'] = ct;
  if (authValue) headers['x-forwarded-authorization'] = authValue;
  if (ak && ws) {
    headers['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    headers['X-Blaxel-Workspace'] = ws;
  }

  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    const raw = await getRawBody(req as unknown as import('stream').Readable);
    body = raw.toString('latin1');
  }

  try {
    const fetchRes = await fetch(url, { method: req.method || 'GET', headers, body, redirect: 'follow' });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
