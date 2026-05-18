import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

export const config = {
  api: {
    bodyParser: false,
    bodySizeLimit: '10mb',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendUrl = process.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
  const ws = process.env.VITE_BLAXEL_WORKSPACE || '';
  const ak = process.env.VITE_BLAXEL_API_KEY || '';

  const incomingPath = req.url || '/';
  const pathname = incomingPath.split('?')[0];

  if (pathname === '/debug' || pathname === 'debug') {
    return res.json({
      source: 'vercel-proxy',
      env_keys: Object.keys(process.env).sort(),
      values: {
        VITE_API_URL: process.env.VITE_API_URL || 'NOT SET',
        VITE_BLAXEL_WORKSPACE: process.env.VITE_BLAXEL_WORKSPACE ? `SET (${process.env.VITE_BLAXEL_WORKSPACE.length} chars)` : 'NOT SET',
        VITE_BLAXEL_API_KEY: process.env.VITE_BLAXEL_API_KEY ? `SET (${process.env.VITE_BLAXEL_API_KEY.length} chars)` : 'NOT SET',
        JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? `SET (${process.env.JWT_SECRET_KEY.length} chars)` : 'NOT SET',
        FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        DEEPINFRA_API_TOKEN: process.env.DEEPINFRA_API_TOKEN ? 'SET' : 'NOT SET',
      },
    });
  }

  const stripped = pathname.replace(/^\/api\/?/, '');
  const targetPath = `${backendUrl}/${stripped}`;

  const parsedUrl = new URL(targetPath);
  const isHttps = parsedUrl.protocol === 'https:';
  const httpModule = isHttps ? https : (await import('http')).default;

  const rawAuth = req.headers['authorization'];
  const authValue = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;

  const fwdHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string' && !['host', 'connection', 'authorization'].includes(key)) {
      fwdHeaders[key] = value;
    }
  }
  if (authValue) {
    fwdHeaders['x-forwarded-authorization'] = authValue;
  }
  if (ak && ws) {
    fwdHeaders['x-blaxel-authorization'] = `Bearer ${ak}`;
    fwdHeaders['x-blaxel-workspace'] = ws;
  }

  console.log(`[PROXY] ak=${ak ? 'SET' : 'MISSING'} ws=${ws ? 'SET' : 'MISSING'} auth=${authValue ? 'SET' : 'MISSING'} xfwd=${fwdHeaders['x-forwarded-authorization'] ? 'SET' : 'MISSING'} blauth=${fwdHeaders['x-blaxel-authorization'] ? 'SET' : 'MISSING'}`);

  const proxyReq = httpModule.request({
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method || 'GET',
    headers: fwdHeaders,
  }, (proxyRes) => {
    res.setHeader('x-proxy-debug', `ak=${ak?'Y':'N'} ws=${ws?'Y':'N'} auth=${authValue?'Y':'N'} xfwd=${fwdHeaders['x-forwarded-authorization']?'Y':'N'}`);
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
