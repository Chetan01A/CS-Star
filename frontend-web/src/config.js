export const APP_BASE_URL = (import.meta.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const WS_BASE_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000').replace(/\/+$/, '');

export const buildAssetUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};
