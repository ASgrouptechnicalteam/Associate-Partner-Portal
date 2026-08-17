import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://associate-partner-portal.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Remove the global application/json header for FormData
    // This allows the browser/Axios to automatically set multipart/form-data with the correct boundary
    delete config.headers['Content-Type'];
  }
  return config;
});

export const getStaticUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiUrl =
  import.meta.env.VITE_API_URL ||
  'https://associate-partner-portal.onrender.com/api';
  const baseUrl = apiUrl.replace(/\/api.*$/, '');
  
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default api;
