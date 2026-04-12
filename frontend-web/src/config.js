export const APP_BASE_URL = (import.meta.env.VITE_APP_URL || 'https://cs-star.vercel.app').replace(/\/+$/, '');
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
export const WS_BASE_URL = (import.meta.env.VITE_WS_URL || 'wss://cs-star-1.onrender.com').replace(/\/+$/, '');

export const buildAssetUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};
