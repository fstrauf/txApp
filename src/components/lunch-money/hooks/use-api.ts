import { useState, useCallback } from 'react';
import { Transaction, ApiCallProps, ExternalApiCallProps, ApiResponse, PredictionResponse, ApiMethod } from '../types';

// Extract error message from API response or Error object
const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || `API error: ${response.status}`;
  } catch {
    return `API error: ${response.status} ${response.statusText}`;
  }
};

export function useApi() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Set loading state for a specific endpoint
  const setLoading = useCallback((endpoint: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [endpoint]: isLoading
    }));
  }, []);

  // Check if a specific endpoint is loading
  const isLoading = useCallback((endpoint: string): boolean => {
    return !!loadingStates[endpoint];
  }, [loadingStates]);

  // Core API call function with standardized error handling
  const callApi = useCallback(async <T>({
    endpoint,
    method = 'GET',
    data = null,
    params = {},
    timeout = 30000,
    signal
  }: ApiCallProps): Promise<ApiResponse<T>> => {
    const response: ApiResponse<T> = {
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false
    };

    try {
      // Set loading state
      setLoading(endpoint, true);
      
      // Set up timeout if not provided
      const timeoutSignal = signal || timeout ? AbortSignal.timeout(timeout) : undefined;
      
      // Build URL with query parameters
      const url = new URL(`/api/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`, window.location.origin);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      // Prepare fetch options
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: timeoutSignal
      };

      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }

      const fetchResponse = await fetch(url.toString(), options);
      
      // Handle non-OK responses
      if (!fetchResponse.ok) {
        throw new Error(await getErrorMessage(fetchResponse));
      }

      // Parse successful response
      const responseData = await fetchResponse.json() as T;
      
      return {
        data: responseData,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      };
    } catch (error) {
      // Handle aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          data: null,
          isLoading: false,
          error: 'Request timed out',
          isError: true,
          isSuccess: false
        };
      }
      
      // Handle other errors
      const errorMessage = error instanceof Error 
        ? `Error calling ${endpoint}: ${error.message}`
        : `Unknown error calling ${endpoint}`;
      
      return {
        data: null,
        isLoading: false,
        error: errorMessage,
        isError: true,
        isSuccess: false
      };
    } finally {
      setLoading(endpoint, false);
    }
  }, [setLoading]);

  // Wrapper for external API calls
  const callExternalApi = useCallback(async <T>({
    endpoint,
    method = 'GET',
    data = null,
    apiKey = 'test_api_key_fixed',
    timeout = 30000,
    signal
  }: ExternalApiCallProps): Promise<ApiResponse<T>> => {
    const response: ApiResponse<T> = {
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false
    };

    try {
      // Set loading state using a normalized endpoint key
      const endpointKey = `external:${endpoint.replace(/https?:\/\//, '')}`;
      setLoading(endpointKey, true);
      
      // Set up timeout if not provided
      const timeoutSignal = signal || timeout ? AbortSignal.timeout(timeout) : undefined;

      // Prepare fetch options
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': apiKey
        },
        signal: timeoutSignal
      };

      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }

      const fetchResponse = await fetch(endpoint, options);
      
      // Handle non-OK responses
      if (!fetchResponse.ok) {
        throw new Error(await getErrorMessage(fetchResponse));
      }

      // Parse successful response
      const responseData = await fetchResponse.json() as T;
      
      return {
        data: responseData,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true
      };
    } catch (error) {
      // Handle aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          data: null,
          isLoading: false,
          error: 'Request timed out',
          isError: true,
          isSuccess: false
        };
      }
      
      // Handle other errors
      const errorMessage = error instanceof Error 
        ? `Error calling external API: ${error.message}`
        : `Unknown error calling external API`;
      
      return {
        data: null,
        isLoading: false,
        error: errorMessage,
        isError: true,
        isSuccess: false
      };
    } finally {
      const endpointKey = `external:${endpoint.replace(/https?:\/\//, '')}`;
      setLoading(endpointKey, false);
    }
  }, [setLoading]);

  // Common payload properties for ML API
  const getBaseMLPayload = useCallback(() => ({
    userId: 'test_user_fixed',
    spreadsheetId: 'lunchmoney'
  }), []);

  // Specialized API functions with proper loading states and error handling

  // Fetch transactions with optional date range
  const fetchTransactions = useCallback(async (dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<{ transactions: Transaction[] }>> => {
    const params: Record<string, string> = {};
    if (dateRange) {
      params.start_date = dateRange.startDate;
      params.end_date = dateRange.endDate;
    }
    
    return callApi<{ transactions: Transaction[] }>({
      endpoint: 'lunch-money/transactions',
      params
    });
  }, [callApi]);

  // Fetch categories
  const fetchCategories = useCallback(async (): Promise<ApiResponse<{ categories: any[] }>> => {
    return callApi<{ categories: any[] }>({
      endpoint: 'lunch-money/categories'
    });
  }, [callApi]);

  // Update transaction category
  const updateTransactionCategory = useCallback(async (
    transactionId: string, 
    categoryId: string | null, 
    tags?: string[]
  ): Promise<ApiResponse<any>> => {
    return callApi<any>({
      endpoint: 'lunch-money/transactions',
      method: 'PATCH',
      data: {
        transactionId,
        categoryId,
        tags
      }
    });
  }, [callApi]);

  // Import transactions
  const importTransactions = useCallback(async (
    transactions: Transaction[]
  ): Promise<ApiResponse<{ count: number }>> => {
    return callApi<{ count: number }>({
      endpoint: 'lunch-money/transactions',
      method: 'POST',
      data: { transactions }
    });
  }, [callApi]);

  // Update transaction tags
  const updateTransactionTags = useCallback(async (
    transactionId: string, 
    tags: string[]
  ): Promise<ApiResponse<any>> => {
    return callApi<any>({
      endpoint: 'lunch-money/transactions',
      method: 'PATCH',
      data: {
        transactionId,
        tags
      }
    });
  }, [callApi]);

  // Training API call
  const trainModel = useCallback(async (
    trainingData: any[]
  ): Promise<ApiResponse<PredictionResponse>> => {
    const payload = {
      ...getBaseMLPayload(),
      transactions: trainingData,
      expenseSheetId: 'lunchmoney',
      columnOrderCategorisation: {
        descriptionColumn: "B",
        categoryColumn: "C",
      },
      categorisationRange: "A:Z",
      categorisationTab: "LunchMoney"
    };

    return callExternalApi<PredictionResponse>({
      endpoint: process.env.EXPENSE_SORTED_API + '/train',
      method: 'POST',
      data: payload
    });
  }, [callExternalApi, getBaseMLPayload]);

  // Categorization API call
  const categorizeTransactions = useCallback(async (
    transactions: string[]
  ): Promise<ApiResponse<PredictionResponse>> => {
    const payload = {
      ...getBaseMLPayload(),
      transactions,
      sheetName: 'test-sheet',
      categoryColumn: 'E',
      startRow: '1'
    };

    return callExternalApi<PredictionResponse>({
      endpoint: process.env.EXPENSE_SORTED_API + '/classify',
      method: 'POST',
      data: payload
    });
  }, [callExternalApi, getBaseMLPayload]);

  // Check prediction status
  const checkPredictionStatus = useCallback(async (
    predictionId: string
  ): Promise<ApiResponse<any>> => {
    return callExternalApi<any>({
      endpoint: `${process.env.EXPENSE_SORTED_API}/status/${predictionId}`,
      method: 'GET'
    });
  }, [callExternalApi]);

  return {
    // Core API functions
    callApi,
    callExternalApi,
    
    // Loading state utilities
    isLoading,
    loadingStates,
    
    // Lunch Money API endpoints
    fetchTransactions,
    fetchCategories,
    updateTransactionCategory,
    importTransactions,
    updateTransactionTags,
    
    // ML API endpoints
    trainModel,
    categorizeTransactions,
    checkPredictionStatus
  };
} 