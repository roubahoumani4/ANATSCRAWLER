import axios from 'axios';
import { API_BASE_URL } from './api';

// Configure the default axios instance
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Add request interceptor to default instance
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🔐 Axios request:', config.method?.toUpperCase(), config.url, {
      hasAuth: !!token,
      withCredentials: config.withCredentials
    });
    return config;
  },
  (error) => {
    console.error('❌ Axios request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to default instance
axios.interceptors.response.use(
  (response) => {
    console.log('✅ Axios response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Axios response error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.response?.data);
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle session terminated or expired
      if (status === 401 && (data.error === 'Session terminated' || data.error === 'Token expired' || data.error === 'jwt expired')) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        if (data.error === 'Session terminated') {
          alert('Your session has been terminated by an administrator. You will be redirected to the login page.');
        }
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Create axios instance (for compatibility with existing code)
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session termination
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle session terminated
      if (status === 401 && data.error === 'Session terminated') {
        // Clear local storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Show alert to user
        alert('Your session has been terminated by an administrator. You will be redirected to the login page.');
        
        // Redirect to login
        window.location.href = '/login';
      }
      
      // Handle token expired
      if (status === 401 && data.error === 'Token expired') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
