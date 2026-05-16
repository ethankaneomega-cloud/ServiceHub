import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
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

// Helper for uploaded images/files
export const getUploadUrl = (path) => {
  if (!path) return '';

  // Already full URL
  if (path.startsWith('http')) {
    return path;
  }

  const BASE = API_URL.replace('/api', '');

  return `${BASE}${path}`;
};

export default api;