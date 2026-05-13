import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '/api',
});

export default api;
