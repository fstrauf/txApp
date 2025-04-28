'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Optional: If you want React Query DevTools
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; 

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance (ensure it's only created once per render)
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: React Query DevTools - useful for development */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
} 