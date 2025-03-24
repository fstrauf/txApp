import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './use-api';
import { ApiCallProps, ApiResponse, ApiStatus } from '../types';

interface UseApiHookOptions<T> {
  // Function to execute for initial loading or on manual refresh
  fetchFn: () => Promise<ApiResponse<T>>;
  // Whether to fetch on mount automatically
  loadOnMount?: boolean;
  // Dependencies that trigger a reload when changed
  dependencies?: any[];
  // Initial data (if available)
  initialData?: T | null;
  // Function to transform the response data
  transformData?: (data: T) => any;
  // Function to handle errors
  onError?: (error: string) => void;
}

interface UseApiHookResult<T, R = T> {
  // Current data state
  data: R | null;
  // Raw response data before transformation
  rawData: T | null;
  // Current loading state
  isLoading: boolean;
  // Error message if present
  error: string | null;
  // If the request has errored
  isError: boolean;
  // If the request was successful
  isSuccess: boolean;
  // Current operation status
  status: ApiStatus;
  // Function to manually trigger a refresh
  refetch: () => Promise<void>;
  // Reset the state to initial values
  reset: () => void;
}

export function useApiHook<T, R = T>({
  fetchFn,
  loadOnMount = true,
  dependencies = [],
  initialData = null,
  transformData,
  onError
}: UseApiHookOptions<T>): UseApiHookResult<T, R> {
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // States for data, loading, and errors
  const [data, setData] = useState<T | null>(initialData);
  const [transformedData, setTransformedData] = useState<R | null>(
    transformData && initialData ? (transformData(initialData) as R) : (initialData as unknown as R)
  );
  const [status, setStatus] = useState<ApiStatus>(loadOnMount ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);
  
  // Transform data safely
  const transformDataSafely = useCallback((data: T): R => {
    return transformData ? (transformData(data) as R) : (data as unknown as R);
  }, [transformData]);
  
  // Memoize the fetchData function to avoid unnecessary re-renders
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setStatus('loading');
    setError(null);
    
    try {
      const response = await fetchFn();
      
      if (!isMounted.current) return;
      
      if (response.isError || !response.data) {
        setStatus('error');
        const errorMessage = response.error || 'Unknown error occurred';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        return;
      }
      
      setData(response.data);
      setTransformedData(transformDataSafely(response.data));
      setStatus('success');
    } catch (err) {
      if (!isMounted.current) return;
      
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  }, [fetchFn, onError, transformDataSafely]);

  // Reset the state to initial values
  const reset = useCallback(() => {
    setData(initialData);
    setTransformedData(
      initialData ? transformDataSafely(initialData) : null
    );
    setStatus('idle');
    setError(null);
  }, [initialData, transformDataSafely]);

  // Effect to fetch data on mount if loadOnMount is true
  useEffect(() => {
    isMounted.current = true;
    
    if (loadOnMount) {
      fetchData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchData, loadOnMount]);

  // Effect to refetch data when dependencies change
  useEffect(() => {
    if (dependencies.length > 0 && isMounted.current && status !== 'idle') {
      fetchData();
    }
  }, [...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: transformedData,
    rawData: data,
    isLoading: status === 'loading',
    error,
    isError: status === 'error',
    isSuccess: status === 'success',
    status,
    refetch: fetchData,
    reset
  };
}

// Helper hook for fetching data with the useApi hook
export function useFetch<T, R = T>(
  endpoint: string,
  options: Omit<ApiCallProps, 'endpoint'> & {
    loadOnMount?: boolean;
    dependencies?: any[];
    transformData?: (data: T) => R;
    onError?: (error: string) => void;
    onSuccess?: (data: T) => void;
    initialData?: T | null;
  } = {}
): UseApiHookResult<T, R> {
  const { 
    loadOnMount = true, 
    dependencies = [], 
    transformData, 
    onError,
    onSuccess,
    initialData = null,
    ...apiOptions 
  } = options;
  
  const { callApi } = useApi();
  
  const fetchFn = useCallback(async () => {
    const response = await callApi<T>({
      endpoint,
      ...apiOptions
    });
    
    if (response.isSuccess && response.data && onSuccess) {
      onSuccess(response.data);
    }
    
    return response;
  }, [callApi, endpoint, apiOptions, onSuccess]);
  
  return useApiHook<T, R>({
    fetchFn,
    loadOnMount,
    dependencies,
    transformData,
    onError,
    initialData
  });
}

// Helper hook for mutations (POST, PUT, PATCH, DELETE) with the useApi hook
export function useMutation<T, D = any>(
  endpoint: string,
  options: Omit<ApiCallProps, 'endpoint' | 'data' | 'method'> & {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    transformData?: (data: T) => any;
  } = {}
) {
  const { 
    method = 'POST', 
    onSuccess, 
    onError, 
    transformData,
    ...apiOptions 
  } = options;
  
  const { callApi } = useApi();
  const [status, setStatus] = useState<ApiStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mutate = useCallback(async (mutationData?: D): Promise<ApiResponse<T>> => {
    setStatus('loading');
    setError(null);
    
    try {
      const response = await callApi<T>({
        endpoint,
        method,
        data: mutationData,
        ...apiOptions
      });
      
      if (response.isError || !response.data) {
        setStatus('error');
        const errorMessage = response.error || 'Unknown error occurred';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        return response;
      }
      
      setData(response.data);
      setStatus('success');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response;
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return {
        data: null,
        isLoading: false,
        error: errorMessage,
        isError: true,
        isSuccess: false
      };
    }
  }, [callApi, endpoint, method, apiOptions, onSuccess, onError]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);
  
  return {
    mutate,
    data: transformData && data ? transformData(data) : data,
    isLoading: status === 'loading',
    error,
    isError: status === 'error',
    isSuccess: status === 'success',
    status,
    reset
  };
} 