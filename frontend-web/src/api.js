import { API_BASE_URL } from './config';

const clearAuthAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

const readResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { detail: text } : {};
  }

  try {
    return await response.json();
  } catch (e) {
    console.error('Failed to parse API response', e);
    return {};
  }
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshRes.ok) return false;

    const data = await refreshRes.json();
    if (!data?.access_token) return false;

    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch (e) {
    console.error('Token refresh failed', e);
    return false;
  }
};

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  async fetch(endpoint, options = {}, isRetry = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...getHeaders(), ...options.headers };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        return this.fetch(endpoint, options, true);
      }
      
      // If refresh failed or no refresh token, logout
      clearAuthAndRedirect();
      return;
    }

    const data = await readResponseBody(response);
    if (!response.ok) {
      throw new Error(data.detail || 'Something went wrong');
    }
    return data;
  },

  post(endpoint, body) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  get(endpoint) {
    return this.fetch(endpoint, {
      method: 'GET',
    });
  },

  put(endpoint, body) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async upload(endpoint, formData, isRetry = false) {
    const fetchOptions = {
      method: 'POST',
      body: formData,
    };
    
    // We don't use 'api.fetch' here because 'fetch' automatically sets multi-part headers
    // But we still want the auth header and the retry logic.
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401 && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return this.upload(endpoint, formData, true);
      }
      clearAuthAndRedirect();
      return;
    }

    const data = await readResponseBody(response);
    if (!response.ok) {
      throw new Error(data.detail || 'Upload failed');
    }
    return data;
  }
};
