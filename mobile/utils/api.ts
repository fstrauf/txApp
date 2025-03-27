import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import ApiService from '../shared/api';
import { LoginRequest } from '../shared/types';

// Get API URL from constants or use a default value
// In a production app, you would want to configure this properly
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
console.log('[API Config] Using API URL:', API_URL);

// Create API instance
const api = new ApiService(API_URL);

// Helper methods for token management
export const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync('userToken', token);
    api.setToken(token);
    console.log('[Token Storage] Token stored successfully');
  } catch (error) {
    console.error('[Token Storage] Error storing token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    console.log('[Token Storage] Token retrieved:', token ? 'exists' : 'not found');
    return token;
  } catch (error) {
    console.error('[Token Storage] Error retrieving token:', error);
    throw error;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync('userToken');
    api.clearToken();
    console.log('[Token Storage] Token removed successfully');
  } catch (error) {
    console.error('[Token Storage] Error removing token:', error);
    throw error;
  }
};

// Authentication functions
export const login = async (email: string, password: string) => {
  console.log('[Auth] Attempting login for:', email);
  try {
    const loginData: LoginRequest = { email, password };
    const result = await api.login(loginData);
    
    if (result.data?.token) {
      await storeToken(result.data.token);
      console.log('[Auth] Login successful');
    } else {
      console.warn('[Auth] Login response missing token:', result);
    }
    
    return result;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  console.log('[Auth] Logging out');
  try {
    await removeToken();
    const result = await api.logout();
    console.log('[Auth] Logout successful');
    return result;
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    throw error;
  }
};

// Initialize token from storage
export const initializeAuth = async (): Promise<boolean> => {
  console.log('[Auth] Initializing authentication');
  try {
    const token = await getToken();
    if (token) {
      api.setToken(token);
      console.log('[Auth] Authentication initialized with token');
      return true;
    }
    console.log('[Auth] No token found during initialization');
    return false;
  } catch (error) {
    console.error('[Auth] Error initializing authentication:', error);
    return false;
  }
};

// Export the API service instance
export default api; 