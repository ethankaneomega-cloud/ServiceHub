import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

// Derive the uploads base URL from the API URL
// e.g. https://my-backend.onrender.com/api → https://my-backend.onrender.com
const UPLOADS_BASE_URL = BASE_URL ? BASE_URL.replace(/\/api\/?$/, '') : '';

/**
 * Returns the full URL for a file stored in the backend's /uploads directory.
 * Pass the filename (e.g. user.profilePicture) and get back a usable src URL.
 */
export const getUploadUrl = (filename) => {
  if (!filename) return null;
  // Already an absolute URL — return as-is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${UPLOADS_BASE_URL}/uploads/${filename}`;
};

// Create axios instance pointed at the backend API
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request
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

// On 401 responses, clear local auth state and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on a public page
      const publicPaths = ['/', '/login', '/register', '/register-worker'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
