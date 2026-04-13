export const APP_BASE_URL = (import.meta.env.VITE_APP_URL || (import.meta.env.DEV ? 'http://localhost:5173' : 'https://cs-star.onrender.com')).replace(/\/+$/, '');
export const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://cs-star-1.onrender.com')).replace(/\/+$/, '');
export const WS_BASE_URL = (import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'ws://localhost:8000' : 'wss://cs-star-1.onrender.com')).replace(/\/+$/, '');

export const buildAssetUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};
