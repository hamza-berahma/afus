import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.error?.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth
  login: (credentials: { emailOrPhone: string; password: string }) => {
    // Split emailOrPhone into email or phone based on format
    const isEmail = credentials.emailOrPhone.includes('@');
    const loginData = isEmail
      ? { email: credentials.emailOrPhone, password: credentials.password }
      : { phone: credentials.emailOrPhone, password: credentials.password };
    return api.post('/auth/login', loginData);
  },
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  // Products
  getProducts: (params?: any) =>
    api.get('/products', { params }),
  
  getProduct: (id: string) =>
    api.get(`/products/${id}`),
  
  // Transactions
  simulateTransaction: (data: any) =>
    api.post('/transactions/simulate', data),
  
  createTransaction: (data: { productId: string; quantity: number; simulatedFee: number }) =>
    api.post('/transactions/create', data),
  
  getTransaction: (id: string) =>
    api.get(`/transactions/${id}`),
  
  shipTransaction: (id: string) =>
    api.post(`/transactions/${id}/ship`),
  
  markDelivered: (id: string) =>
    api.post(`/transactions/${id}/mark-delivered`),
  
  confirmDelivery: (id: string, data: any) =>
    api.post(`/transactions/${id}/confirm-delivery`, data),
  
  // Wallet
  getWalletBalance: () =>
    api.get('/wallet/balance'),
  
  getWalletTransactions: (params?: any) =>
    api.get('/wallet/transactions', { params }),
  
  activateWallet: () =>
    api.post('/wallet/activate'),
  
  // Cooperatives
  getCooperatives: (params?: any) =>
    api.get('/cooperatives', { params }),
  
  getCooperative: (id: string) =>
    api.get(`/cooperatives/${id}`),
  
  registerCooperative: (data: any) =>
    api.post('/cooperatives/register', data),
  
  // Products (Producer)
  createProduct: (data: any) =>
    api.post('/products', data),
  
  updateProduct: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
  
  // Dashboard
  getDashboardStats: () =>
    api.get('/dashboard/stats'),
  
  getDashboardAnalytics: (params?: { period?: string }) =>
    api.get('/dashboard/analytics', { params }),
  
  // Favorites
  getFavorites: () =>
    api.get('/favorites'),
  
  addFavorite: (productId: string) =>
    api.post(`/favorites/${productId}`),
  
  removeFavorite: (productId: string) =>
    api.delete(`/favorites/${productId}`),
  
  checkFavorite: (productId: string) =>
    api.get(`/favorites/check/${productId}`),
  
  getFavoriteIds: () =>
    api.get('/favorites/ids'),
  
  // Credit Score
  getCreditScore: () =>
    api.get('/credit-score/me'),
};

