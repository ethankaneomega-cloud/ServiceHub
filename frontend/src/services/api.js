import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const UPLOADS_BASE_URL = BASE_URL ? BASE_URL.replace(/\/api\/?$/, '') : '';

export const getUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${UPLOADS_BASE_URL}/uploads/${filename}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = ['/', '/login', '/register', '/register-worker'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;