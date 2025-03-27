import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ApiError,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  TransactionResponse,
  UserProfile,
} from './types';

/**
 * API service for both web and mobile applications
 */
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token to headers
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log('[API Request]', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('[API Response]', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error: AxiosError) => {
        const apiError: ApiError = {
          status: error.response?.status || 500,
          message: error.message,
        };

        if (error.response?.data) {
          apiError.message = (error.response.data as any).error || apiError.message;
        }

        console.error('[API Error]', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
          },
        });

        return Promise.reject(apiError);
      }
    );

    console.log('[API Service] Initialized with baseURL:', baseURL);
  }

  // Set authentication token
  public setToken(token: string): void {
    this.token = token;
    console.log('[API Service] Token set');
  }

  // Clear authentication token
  public clearToken(): void {
    this.token = null;
    console.log('[API Service] Token cleared');
  }

  // Authentication methods
  public async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('[API Login] Attempting login for:', data.email);
      const response = await this.api.post<LoginResponse>('/auth/login', data);
      this.setToken(response.data.token);
      return { data: response.data };
    } catch (error) {
      console.error('[API Login] Error:', error);
      return { error: (error as ApiError).message };
    }
  }

  public async logout(): Promise<ApiResponse<void>> {
    try {
      this.clearToken();
      return { message: 'Logged out successfully' };
    } catch (error) {
      return { error: (error as ApiError).message };
    }
  }

  // User methods
  public async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.get<{ user: UserProfile }>('/api/user/profile');
      return { data: response.data.user };
    } catch (error) {
      return { error: (error as ApiError).message };
    }
  }

  // Transaction methods
  public async getTransactions(): Promise<ApiResponse<TransactionResponse>> {
    try {
      const response = await this.api.get<TransactionResponse>('/api/transactions');
      return { data: response.data };
    } catch (error) {
      return { error: (error as ApiError).message };
    }
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request<T>(config);
      return { data: response.data };
    } catch (error) {
      return { error: (error as ApiError).message };
    }
  }
}

export default ApiService; 