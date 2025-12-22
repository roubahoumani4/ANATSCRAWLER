import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from "axios";

// Configure axios defaults globally
axios.defaults.withCredentials = true;

// Add request interceptor to include token
axios.interceptors.request.use(
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

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle session terminated or token expired
      if (status === 401 && (data.error === 'Session terminated' || data.error === 'Token expired' || data.error === 'jwt expired')) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        if (data.error === 'Session terminated') {
          alert('Your session has been terminated by an administrator. You will be redirected to the login page.');
        }
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<App />);
