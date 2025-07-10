// src/app/personal-finance/hooks/useAuthenticationBarrier.ts
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Authentication Barrier Hook
 * 
 * Provides a stable authentication state that prevents cascading effects
 * during login/logout transitions. Components should wait for `isReady`
 * before executing effects or making API calls.
 */
export const useAuthenticationBarrier = () => {
  const { data: session, status } = useSession();
  
  // Track initialization and state changes
  const [isReady, setIsReady] = useState(false);
  const [stableAuthState, setStableAuthState] = useState<{
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
  }>({
    isAuthenticated: false,
    userId: null,
    email: null
  });
  
  // Use refs to track previous values and prevent unnecessary updates
  const prevStatus = useRef<string>('loading');
  const prevUserId = useRef<string | null>(null);
  const stabilizationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Create stable auth values
  const currentUserId = session?.user?.id || null;
  const currentEmail = session?.user?.email || null;
  const currentIsAuthenticated = !!(session?.user?.id);
  
  // Detect when authentication state has actually changed
  const hasAuthStateChanged = useMemo(() => {
    return prevStatus.current !== status || prevUserId.current !== currentUserId;
  }, [status, currentUserId]);
  
  // Stabilization effect - waits for auth state to be stable before marking ready
  useEffect(() => {
    // Clear any existing timer
    if (stabilizationTimer.current) {
      clearTimeout(stabilizationTimer.current);
    }
    
    // If auth state changed, reset ready state and start stabilization
    if (hasAuthStateChanged) {
      setIsReady(false);
      
      // Update previous values
      prevStatus.current = status;
      prevUserId.current = currentUserId;
      
      // Wait for auth state to stabilize (no changes for 100ms)
      stabilizationTimer.current = setTimeout(() => {
        // Update stable auth state
        setStableAuthState({
          isAuthenticated: currentIsAuthenticated,
          userId: currentUserId,
          email: currentEmail
        });
        
        // Mark as ready
        setIsReady(true);
      }, 100);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (stabilizationTimer.current) {
        clearTimeout(stabilizationTimer.current);
      }
    };
  }, [hasAuthStateChanged, status, currentUserId, currentIsAuthenticated, currentEmail]);
  
  // Handle loading state
  const isLoading = status === 'loading' || !isReady;
  
  return {
    // Stable authentication state (only updates when truly stable)
    isAuthenticated: stableAuthState.isAuthenticated,
    userId: stableAuthState.userId,
    email: stableAuthState.email,
    
    // Ready state - wait for this before executing effects
    isReady,
    isLoading,
    
    // Original session for cases that need it
    session,
    status
  };
}; 