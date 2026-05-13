import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

const ws = import.meta.env.VITE_BLAXEL_WORKSPACE || '';
const ak = import.meta.env.VITE_BLAXEL_API_KEY || '';

if (ak && ws) {
  api.defaults.headers.common['X-Blaxel-Authorization'] = `Bearer ${ak}`;
  api.defaults.headers.common['X-Blaxel-Workspace'] = ws;
}

export default api;
