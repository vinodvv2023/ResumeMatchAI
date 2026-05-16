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

  const fwdHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string' && !['host', 'connection', 'transfer-encoding', 'content-length'].includes(key)) {
      fwdHeaders[key] = value;
    }
  }
  fwdHeaders['Accept'] = 'application/json';
  if (ak && ws) {
    fwdHeaders['x-blaxel-authorization'] = `Bearer ${ak}`;
    fwdHeaders['x-blaxel-workspace'] = ws;
  }

  const chunks: Buffer[] = [];
  let bodySize = 0;
  for await (const chunk of req as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk);
    bodySize += chunk.length;
  }
  const rawBody = Buffer.concat(chunks);

  if (bodySize > 0) {
    fwdHeaders['content-length'] = String(bodySize);
  }

  try {
    const fetchRes = await fetch(url, {
      method: req.method || 'GET',
      headers: fwdHeaders,
      body: bodySize > 0 ? rawBody.buffer as ArrayBuffer : undefined,
      redirect: 'follow',
    });
    const data = await fetchRes.text();
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
}
