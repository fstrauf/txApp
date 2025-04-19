'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  login: (newToken: string) => void;
  logout: () => void;
  isLoading: boolean; // Added state to track initial token loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  // Load token from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
        console.error("Failed to access localStorage:", error); 
        // Handle cases where localStorage is not available (e.g., SSR initial render, security settings)
    } finally {
        setIsLoading(false); // Finished loading attempt
    }
  }, []);

  const login = (newToken: string) => {
    try {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    } catch (error) {
        console.error("Failed to save token to localStorage:", error);
        // Still set token in state even if localStorage fails
        setToken(newToken);
    }
  };

  const logout = () => {
    try {
        localStorage.removeItem('authToken');
    } catch (error) {
        console.error("Failed to remove token from localStorage:", error);
    } finally {
        setToken(null);
    }
  };

  const value = { token, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 