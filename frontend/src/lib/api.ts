import axios from 'axios';
import { settings } from '@blaxel/core';

const workspace = import.meta.env.VITE_BLAXEL_WORKSPACE || '';
const apiKey = import.meta.env.VITE_BLAXEL_API_KEY || '';
const clientId = import.meta.env.VITE_BLAXEL_CLIENT_ID || '';
const clientSecret = import.meta.env.VITE_BLAXEL_CLIENT_SECRET || '';

if (apiKey && workspace) {
  settings.setConfig({ apiKey, workspace });
} else if (clientId && clientSecret && workspace) {
  settings.setConfig({ clientCredentials: { clientId, clientSecret }, workspace });
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000'),
});

api.interceptors.request.use(async (config) => {
  await settings.authenticate();
  const blaxelHeaders = settings.headers;
  if (blaxelHeaders['x-blaxel-authorization']) {
    config.headers['X-Blaxel-Authorization'] = blaxelHeaders['x-blaxel-authorization'];
    config.headers['X-Blaxel-Workspace'] = blaxelHeaders['x-blaxel-workspace'];
  }
  return config;
});

export default api;
