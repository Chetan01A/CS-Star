import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store'; // We'll need this for tokens

// Android Emulator uses 10.0.2.2 to access the host's localhost
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8000' 
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Auth Header
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          if (res.status === 200) {
            const { access_token } = res.data;
            await SecureStore.setItemAsync('access_token', access_token);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token expired or invalid", refreshError);
        }
      }
      
      // Logout logic here (e.g., redirect to login)
      // await SecureStore.deleteItemAsync('access_token');
      // await SecureStore.deleteItemAsync('refresh_token');
    }
    
    return Promise.reject(error);
  }
);

export default api;
