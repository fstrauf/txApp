'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Provider component specific to settings
export default function SettingsQueryProvider({ children }: { children: React.ReactNode }) {
  // Note: For page-specific providers, sharing a client instance like this is simpler.
  // For app-wide usage, the useState pattern is better to prevent sharing across requests.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 