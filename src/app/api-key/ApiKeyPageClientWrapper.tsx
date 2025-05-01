'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Function to create a new QueryClient instance
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default stale time
      },
    },
  });
}

// Singleton QueryClient instance for the browser
let browserQueryClient: QueryClient | undefined = undefined;

// Function to get the QueryClient instance
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return makeQueryClient();
  } else {
    // Browser: use existing client or create one if it doesn't exist
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// The wrapper component providing the QueryClient
export default function ApiKeyPageClientWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
} 