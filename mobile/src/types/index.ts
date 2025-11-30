export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
  walletId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stockQuantity: number;
  imageUrl?: string; // First image (for backward compatibility)
  imageUrls?: string[]; // Array of all images (Amazon-style)
  cooperative?: Cooperative;
  createdAt: string;
  isFavorite?: boolean; // Optional field to indicate if product is favorited
}

export interface Cooperative {
  id: string;
  name: string;
  registrationNumber?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'INITIATED' | 'ESCROWED' | 'SHIPPED' | 'DELIVERED' | 'SETTLED' | 'FAILED';
  escrowTransactionId?: string;
  qrSignature?: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
  buyer?: User;
  seller?: User;
  product?: Product;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  walletId: string;
}

