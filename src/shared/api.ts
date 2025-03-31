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
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Helper method to get headers with authorization if available
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method to handle fetch responses
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError: ApiError = {
        status: response.status,
        message: errorData.error || response.statusText,
      };
      return { error: apiError.message };
    }

    // If response is 204 No Content
    if (response.status === 204) {
      return {};
    }

    const data = await response.json();
    return { data };
  }

  // Set authentication token
  public setToken(token: string): void {
    this.token = token;
  }

  // Clear authentication token
  public clearToken(): void {
    this.token = null;
  }

  // Authentication methods
  public async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<LoginResponse>(response);
      
      if (result.data?.token) {
        this.setToken(result.data.token);
      }
      
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public async logout(): Promise<ApiResponse<void>> {
    try {
      this.clearToken();
      return { message: 'Logged out successfully' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // User methods
  public async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetch(`${this.baseURL}/api/user/profile`, {
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<{ user: UserProfile }>(response);
      return result.data ? { data: result.data.user } : { error: result.error };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Transaction methods
  public async getTransactions(): Promise<ApiResponse<TransactionResponse>> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions`, {
        headers: this.getHeaders(),
      });

      return await this.handleResponse<TransactionResponse>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generic request method
  public async request<T>(config: {
    method?: string;
    url: string;
    data?: any;
    params?: Record<string, string>;
  }): Promise<ApiResponse<T>> {
    try {
      const { method = 'GET', url, data, params } = config;
      
      // Add query parameters if provided
      const queryParams = params ? `?${new URLSearchParams(params)}` : '';
      const fullUrl = `${this.baseURL}${url}${queryParams}`;
      
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };
      
      // Add body data for non-GET requests
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(fullUrl, options);
      return await this.handleResponse<T>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Create instances for different environments
export const createApiService = (baseURL: string): ApiService => {
  return new ApiService(baseURL);
};

export default ApiService; 