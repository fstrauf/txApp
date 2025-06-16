import { useRef, useCallback } from 'react';

interface UseRateLimitOptions {
  cooldownMs: number;
  onRateLimited?: () => void;
}

export const useRateLimit = ({ cooldownMs, onRateLimited }: UseRateLimitOptions) => {
  const lastCallTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  const executeWithRateLimit = useCallback(
    async <T>(fn: () => Promise<T> | T, context?: string): Promise<T | null> => {
      const now = Date.now();
      
      // Check if function is already running
      if (isRunningRef.current) {
        console.log(`⏸️ ${context || 'Function'} already running, skipping...`);
        onRateLimited?.();
        return null;
      }
      
      // Check rate limit
      if (now - lastCallTimeRef.current < cooldownMs) {
        console.log(`⏱️ ${context || 'Function'} rate limited (${cooldownMs}ms cooldown)`);
        onRateLimited?.();
        return null;
      }
      
      isRunningRef.current = true;
      lastCallTimeRef.current = now;
      
      try {
        const result = await fn();
        return result;
      } finally {
        isRunningRef.current = false;
      }
    },
    [cooldownMs, onRateLimited]
  );

  const resetRateLimit = useCallback(() => {
    lastCallTimeRef.current = 0;
    isRunningRef.current = false;
  }, []);

  return { executeWithRateLimit, resetRateLimit };
}; 