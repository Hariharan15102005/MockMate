import axios from 'axios';
import { authStorage } from '../auth/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000/ai';

export const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
backendApi.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Catch 401 Unauthorized
backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        authStorage.clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async () => {
  const start = performance.now();
  try {
    const response = await backendApi.get('/health');
    const latency = Math.round(performance.now() - start);
    return {
      status: 'ONLINE',
      data: response.data,
      latency,
      url: `${API_BASE_URL}/health`,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'OFFLINE',
      error: error.response?.data?.message || error.message || 'Service unreachable',
      latency,
      url: `${API_BASE_URL}/health`,
    };
  }
};

export const checkAiServiceHealth = async () => {
  const start = performance.now();
  try {
    const response = await aiApi.get('/health');
    const latency = Math.round(performance.now() - start);
    return {
      status: 'ONLINE',
      data: response.data,
      latency,
      url: `${AI_BASE_URL}/health`,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'OFFLINE',
      error: error.message || 'Service unreachable',
      latency,
      url: `${AI_BASE_URL}/health`,
    };
  }
};
