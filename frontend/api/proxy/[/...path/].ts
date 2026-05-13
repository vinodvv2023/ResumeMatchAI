import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const backendUrl = (process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const path = (req.query.path as string[] || []).join('/');
  const search = req.url?.includes('?') ? req.url!.substring(req.url!.indexOf('?')) : '';
  const backendTarget = `${backendUrl}/${path}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    Accept: 'application/json',
  };

  const blaxelWorkspace = process.env.VITE_BLAXEL_WORKSPACE || '';
  const blaxelApiKey = process.env.VITE_BLAXEL_API_KEY || '';

  if (blaxelApiKey && blaxelWorkspace) {
    headers['X-Blaxel-Authorization'] = `Bearer ${blaxelApiKey}`;
    headers['X-Blaxel-Workspace'] = blaxelWorkspace;
  }

  try {
    const response = await fetch(backendTarget, {
      method: req.method || 'GET',
      headers,
      body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : JSON.stringify(req.body),
    });

    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    res.status(502).json({ error: message });
  }
}
