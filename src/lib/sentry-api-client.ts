/**
 * Sentry-enhanced API client wrapper for monitoring API requests and errors
 */

import * as Sentry from '@sentry/nextjs';
import { authApi, api, callClassifyApi, classifyWithRetry, type ClassifyApiResponse } from './api-client';

// Enhanced API error type
interface ApiError extends Error {
  statusCode?: number;
  data?: any;
  endpoint?: string;
  method?: string;
}

/**
 * Wrapper function to monitor API requests with Sentry
 */
async function withSentryMonitoring<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: operationName,
      op: 'http.client',
      attributes: {
        'http.request.method': context?.method || 'POST',
        'http.url': context?.endpoint || 'unknown',
        ...context,
      },
    },
    async () => {
      try {
        const result = await operation();
        
        // Log successful API calls
        Sentry.addBreadcrumb({
          category: 'api',
          message: `API call successful: ${operationName}`,
          level: 'info',
          data: context,
        });
        
        return result;
      } catch (error) {
        // Enhance error with context
        if (error instanceof Error) {
          const apiError = error as ApiError;
          apiError.endpoint = context?.endpoint;
          apiError.method = context?.method;
        }
        
        // Capture API errors in Sentry
        Sentry.captureException(error, {
          tags: {
            section: 'api',
            operation: operationName,
          },
          contexts: {
            api: {
              endpoint: context?.endpoint,
              method: context?.method,
              ...context,
            },
          },
        });
        
        throw error;
      }
    }
  );
}

/**
 * Sentry-monitored authentication API
 */
export const sentryAuthApi = {
  async login(email: string, password: string) {
    return withSentryMonitoring(
      'auth.login',
      () => authApi.login(email, password),
      {
        method: 'POST',
        endpoint: '/auth/login',
        user_email: email, // Don't include password in monitoring
      }
    );
  },

  async forgotPassword(email: string) {
    return withSentryMonitoring(
      'auth.forgot-password',
      () => authApi.forgotPassword(email),
      {
        method: 'POST',
        endpoint: '/auth/forgot-password',
        user_email: email,
      }
    );
  },

  async resetPassword(token: string, password: string) {
    return withSentryMonitoring(
      'auth.reset-password',
      () => authApi.resetPassword(token, password),
      {
        method: 'POST',
        endpoint: '/auth/reset-password',
        has_token: !!token,
      }
    );
  },
};

/**
 * Sentry-monitored protected API
 */
export const sentryApi = {
  async getUserProfile(token: string) {
    return withSentryMonitoring(
      'api.get-user-profile',
      () => api.getUserProfile(token),
      {
        method: 'GET',
        endpoint: '/api/user/profile',
        has_token: !!token,
      }
    );
  },

  async getUserTransactions(token: string) {
    return withSentryMonitoring(
      'api.get-user-transactions',
      () => api.getUserTransactions(token),
      {
        method: 'GET',
        endpoint: '/api/transactions',
        has_token: !!token,
      }
    );
  },
};

/**
 * Sentry-monitored classify API calls
 */
export async function sentryCallClassifyApi<T = any>(
  endpoint: string,
  transactions: any[],
  options: {
    userCategories?: any[];
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<ClassifyApiResponse<T>> {
  return withSentryMonitoring(
    'api.classify',
    () => callClassifyApi<T>(endpoint, transactions, options),
    {
      method: 'POST',
      endpoint,
      transaction_count: transactions.length,
      has_user_categories: !!options.userCategories?.length,
      timeout: options.timeout,
    }
  );
}

/**
 * Sentry-monitored classify API with retry
 */
export async function sentryClassifyWithRetry<T = any>(
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
  return withSentryMonitoring(
    'api.classify-with-retry',
    () => classifyWithRetry<T>(endpoint, transactions, options),
    {
      method: 'POST',
      endpoint,
      transaction_count: transactions.length,
      has_user_categories: !!options.userCategories?.length,
      max_retries: options.maxRetries,
      timeout: options.timeout,
    }
  );
}

/**
 * Custom hook for monitoring fetch requests
 */
export async function sentryFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  
  return withSentryMonitoring(
    'fetch',
    async () => {
      const response = await fetch(input, init);
      
      // Monitor HTTP error responses
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.statusCode = response.status;
        error.endpoint = url;
        error.method = method;
        throw error;
      }
      
      return response;
    },
    {
      method,
      endpoint: url,
      status_code: undefined, // Will be set after response
    }
  );
}

// Export the original APIs for backward compatibility
export { authApi, api, callClassifyApi, classifyWithRetry } from './api-client'; 