import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Update this to match your backend
// For Android emulator, use: http://10.0.2.2:5000/api
// For iOS simulator, use: http://localhost:5000/api
// For physical device, use your computer's IP: http://192.168.x.x:5000/api
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development - update this to your backend URL
  : 'https://api.afus.ma/api'; // Production - update this to your production URL

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
  async (config) => {
    const token = await AsyncStorage.getItem('token');
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
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - clear token
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth
  login: (credentials: { emailOrPhone: string; password: string }) => {
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
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
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
  
  confirmDelivery: (id: string, data: { qrSignature: string }) =>
    api.post(`/transactions/${id}/confirm-delivery`, data),
  
  // Cooperatives
  getCooperatives: (params?: any) =>
    api.get('/cooperatives', { params }),
  
  getCooperative: (id: string) =>
    api.get(`/cooperatives/${id}`),
  
  getCooperativeProducts: (id: string, params?: any) =>
    api.get(`/cooperatives/${id}/products`, { params }),
  
  // Wallet
  getWalletBalance: () =>
    api.get('/wallet/balance'),
  
  getWalletTransactions: (params?: any) =>
    api.get('/wallet/transactions', { params }),
  
  activateWallet: () =>
    api.post('/wallet/activate'),
  
  // Wallet Cash Operations
  cashInSimulation: (data: { amount: number; phoneNumber: string }) =>
    api.post('/wallet-api/cash/in?step=simulation', data),
  
  cashInConfirmation: (data: { amount: number; phoneNumber: string; token: string }) =>
    api.post('/wallet-api/cash/in?step=confirmation', data),
  
  cashOutSimulation: (data: { amount: number; phoneNumber: string }) =>
    api.post('/wallet-api/cash/out?step=simulation', data),
  
  cashOutOTP: (data: { token: string }) =>
    api.post('/wallet-api/cash/out/otp', data),
  
  cashOutConfirmation: (data: { amount: number; phoneNumber: string; token: string; otp: string }) =>
    api.post('/wallet-api/cash/out?step=confirmation', data),
  
  // Wallet to Wallet Transfer
  walletTransferSimulation: (data: { contractId: string; destinationPhone: string; amount: number }) =>
    api.post('/wallet-api/transfer/wallet?step=simulation', data),
  
  walletTransferOTP: (data: { token: string }) =>
    api.post('/wallet-api/transfer/wallet/otp', data),
  
  walletTransferConfirmation: (data: { contractId: string; destinationPhone: string; amount: number; token: string; otp: string }) =>
    api.post('/wallet-api/transfer/wallet?step=confirmation', data),
  
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
  
  // Credit Score
  getCreditScore: () =>
    api.get('/credit-score/me'),
  
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
};

