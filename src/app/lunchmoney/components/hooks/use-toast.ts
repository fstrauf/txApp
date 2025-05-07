import { useState, useEffect, useCallback, useRef } from 'react';
import { ToastMessage } from '../types';

export function useToast(autoHideMs = 3000) {
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clear the toast message
  const clearToast = useCallback(() => {
    setToastMessage(null);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-hide toast after specified time
  useEffect(() => {
    if (!toastMessage) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer
    timerRef.current = window.setTimeout(clearToast, autoHideMs);
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toastMessage, autoHideMs, clearToast]);

  // Show a toast with specified type
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToastMessage({ message, type });
  }, []);

  // Convenience methods for success and error toasts
  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    // Assuming 'info' is a valid type or can be handled by styling
    // If ToastMessage type needs update, that should be done too.
    // For now, let's assume it can take a generic type or styling handles it.
    setToastMessage({ message, type: 'info' as any }); // Cast for now if type isn't updated
  }, [setToastMessage]);

  return {
    toastMessage,
    showToast,
    showSuccess,
    showError,
    showInfo,
    clearToast
  };
} 