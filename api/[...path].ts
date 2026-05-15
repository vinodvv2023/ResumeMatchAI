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

function getRawBody(req: import('stream').Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      totalSize += chunk.length;
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const incomingPath = req.url || '/';
  const stripped = incomingPath.replace(/^\/api\/?/, '');
  const url = `${backendUrl}/${stripped}`;

  const ct = req.headers['content-type'] || '';
  const fwdHeaders: Record<string, string> = { Accept: 'application/json' };
  if (ct) fwdHeaders['Content-Type'] = ct;
  if (ak && ws) {
    fwdHeaders['X-Blaxel-Authorization'] = `Bearer ${ak}`;
    fwdHeaders['X-Blaxel-Workspace'] = ws;
  }

  let rawBody: Buffer | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    rawBody = await getRawBody(req as unknown as import('stream').Readable);
    console.log(`[PROXY] ${req.method} ${url} ct=${ct} body_size=${rawBody.length} first_bytes=${rawBody.slice(0, 10).toString('hex')}`);
    fwdHeaders['Content-Length'] = String(rawBody.length);
  }

  try {
    const fetchRes = await fetch(url, {
      method: req.method || 'GET',
      headers: fwdHeaders,
      body: rawBody,
      redirect: 'follow',
    });
    const data = await fetchRes.text();
    console.log(`[PROXY] response ${fetchRes.status} body_len=${data.length}`);
    res.status(fetchRes.status).setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json').send(data);
  } catch (err: unknown) {
    console.log(`[PROXY] error ${err}`);
    res.status(502).json({ error: String(err) });
  }
}
