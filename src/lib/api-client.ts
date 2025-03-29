/**
 * API Client for interfacing with the Hono API endpoints
 * Can be used from both web and mobile applications
 */

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