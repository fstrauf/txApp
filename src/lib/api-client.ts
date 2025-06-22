/**
 * API Client for interfacing with the Hono API endpoints
 * Can be used from both web and mobile applications
 */

import { validateClassifyRequest, handleClassifyError } from './classify-validation';

// Configuration values
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  message: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

interface ApiError extends Error {
  statusCode?: number;
  data?: any;
}

// Helper function to handle API errors
function handleApiError(error: unknown): never {
  if (error instanceof Response) {
    const apiError = new Error('API Error') as ApiError;
    apiError.statusCode = error.status;
    throw apiError;
  }
  throw error;
}

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.error || 'Login failed') as ApiError;
      apiError.statusCode = response.status;
      apiError.data = error;
      throw apiError;
    }

    return response.json();
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.error || 'Password reset request failed') as ApiError;
      apiError.statusCode = response.status;
      apiError.data = error;
      throw apiError;
    }

    return response.json();
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.error || 'Password reset failed') as ApiError;
      apiError.statusCode = response.status;
      apiError.data = error;
      throw apiError;
    }

    return response.json();
  },
};

/**
 * Protected API functions that require authentication
 */
export const api = {
  /**
   * Get user profile
   */
  async getUserProfile(token: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.error || 'Failed to fetch profile') as ApiError;
      apiError.statusCode = response.status;
      apiError.data = error;
      throw apiError;
    }

    return response.json();
  },

  /**
   * Get user transactions
   */
  async getUserTransactions(token: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const apiError = new Error(error.error || 'Failed to fetch transactions') as ApiError;
      apiError.statusCode = response.status;
      apiError.data = error;
      throw apiError;
    }

    return response.json();
  },
};

export interface ClassifyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  status?: number;
}

/**
 * Makes a request to a classify API endpoint with proper validation and error handling
 */
export async function callClassifyApi<T = any>(
  endpoint: string,
  transactions: any[],
  options: {
    userCategories?: any[];
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<ClassifyApiResponse<T>> {
  try {
    // Validate the request data before sending
    const validatedRequest = validateClassifyRequest({
      transactions,
      user_categories: options.userCategories,
    });

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : null;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(validatedRequest),
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}`,
          details: responseData.details || responseData,
          status: response.status,
        };
      }

      return {
        success: true,
        data: responseData,
        status: response.status,
      };
    } catch (fetchError) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          status: 408,
        };
      }
      
      throw fetchError;
    }
  } catch (error) {
    const errorInfo = handleClassifyError(error);
    return {
      success: false,
      error: errorInfo.message,
      details: errorInfo.details,
      status: errorInfo.status,
    };
  }
}

/**
 * Enhanced classify API call with retry logic
 */
export async function classifyWithRetry<T = any>(
  endpoint: string,
  transactions: any[],
  options: {
    userCategories?: any[];
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<ClassifyApiResponse<T>> {
  const { maxRetries = 2, retryDelay = 1000, ...apiOptions } = options;
  
  let lastError: ClassifyApiResponse<T> | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await callClassifyApi<T>(endpoint, transactions, apiOptions);
      
      if (result.success) {
        return result;
      }
      
      // Don't retry on validation errors (4xx status codes)
      if (result.status && result.status >= 400 && result.status < 500) {
        return result;
      }
      
      lastError = result;
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    } catch (error) {
      const errorInfo = handleClassifyError(error);
      lastError = {
        success: false,
        error: errorInfo.message,
        details: errorInfo.details,
        status: errorInfo.status,
      };
      
      // Don't retry on validation errors
      if (errorInfo.status >= 400 && errorInfo.status < 500) {
        break;
      }
    }
  }
  
  return lastError || {
    success: false,
    error: 'All retry attempts failed',
    status: 500,
  };
} 