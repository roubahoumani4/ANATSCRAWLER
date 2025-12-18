import axios from 'axios';
import { API_BASE_URL } from './api';

// Create axios instance
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
