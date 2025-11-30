// User Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
  walletId?: string;
  walletActivated?: boolean;
  cooperativeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQuantity: number;
  imageUrl?: string; // First image (for backward compatibility)
  imageUrls?: string[]; // Array of all images (Amazon-style)
  cooperativeId: string;
  cooperative?: Cooperative;
  createdAt: string;
  updatedAt: string;
}

// Cooperative Types
export interface Cooperative {
  id: string;
  name: string;
  description?: string;
  region: string;
  registrationNumber?: string;
  userId: string;
  user?: User;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: User;
  productId: string;
  product?: Product;
  quantity: number;
  amount: number;
  fee: number;
  total: number;
  totalAmount: number;
  status: 'INITIATED' | 'FEE_SIMULATED' | 'ESCROWED' | 'SHIPPED' | 'DELIVERED' | 'SETTLED' | 'FAILED';
  qrCode?: string;
  transactionLogs?: TransactionLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionLog {
  id: string;
  transactionId: string;
  status: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Wallet Types
export interface Wallet {
  balance: number;
  walletId: string;
  activated: boolean;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  description: string;
  transactionId?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'BUYER' | 'PRODUCER';
  cooperativeName?: string;
  registrationNumber?: string;
  region?: string;
}

// Filter Types
export interface ProductFilters {
  search?: string;
  region?: string;
  cooperativeId?: string;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  inStock?: boolean;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  page?: number;
  limit?: number;
}

