import axios from 'axios';
import { clearTokenCache, getAccessToken } from '../lib/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20_000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (token === 'demo-token') {
      try {
        const stored = localStorage.getItem('medfocus_demo_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.role) config.headers['x-demo-role'] = u.role;
        }
      } catch {}
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      clearTokenCache();
      const freshToken = await getAccessToken(true);
      if (freshToken) {
        original.headers.Authorization = `Bearer ${freshToken}`;
        return api(original);
      }
    }
    const serverMessage = error.response?.data?.error;
    if (serverMessage) {
      error.message = serverMessage;
    }
    return Promise.reject(error);
  },
);

export default api;
