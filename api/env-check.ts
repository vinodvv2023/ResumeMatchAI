import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.json({
    source: 'fresh-deploy-test',
    raw_url: req.url,
    env_keys: Object.keys(process.env).sort(),
    values: {
      VITE_API_URL: process.env.VITE_API_URL || 'NOT SET',
      VITE_BLAXEL_WORKSPACE: process.env.VITE_BLAXEL_WORKSPACE ? `SET (${process.env.VITE_BLAXEL_WORKSPACE.length} chars)` : 'NOT SET',
      VITE_BLAXEL_API_KEY: process.env.VITE_BLAXEL_API_KEY ? `SET (${process.env.VITE_BLAXEL_API_KEY.length} chars)` : 'NOT SET',
      JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? `SET (${process.env.JWT_SECRET_KEY.length} chars)` : 'NOT SET',
    },
  });
}
