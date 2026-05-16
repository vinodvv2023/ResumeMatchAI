import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

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
  const targetPath = `${backendUrl}/${stripped}`;

  const parsedUrl = new URL(targetPath);
  const isHttps = parsedUrl.protocol === 'https:';
  const httpModule = isHttps ? https : (await import('http')).default;

  const fwdHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string' && !['host', 'connection'].includes(key)) {
      fwdHeaders[key] = value;
    }
  }
  fwdHeaders['x-forwarded-authorization'] = fwdHeaders['authorization'] || '';
  delete fwdHeaders['authorization'];
  if (ak && ws) {
    fwdHeaders['x-blaxel-authorization'] = `Bearer ${ak}`;
    fwdHeaders['x-blaxel-workspace'] = ws;
  }

  const proxyReq = httpModule.request({
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method || 'GET',
    headers: fwdHeaders,
  }, (proxyRes) => {
    res.status(proxyRes.statusCode || 502);
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (typeof value === 'string') {
        res.setHeader(key, value);
      } else if (Array.isArray(value)) {
        res.setHeader(key, value.join(', '));
      }
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[PROXY] error: ${err}`);
    res.status(502).json({ error: String(err) });
  });

  (req as unknown as import('stream').Readable).pipe(proxyReq);
}
