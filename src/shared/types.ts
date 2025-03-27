/**
 * Shared types between web and mobile applications
 */

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Transaction types
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  userId: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
} 