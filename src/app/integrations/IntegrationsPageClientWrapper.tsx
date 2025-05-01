'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
// We use useState to ensure the client is only created once per mount
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function IntegrationsPageClientWrapper({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState pattern for QueryClientProvider client prop. Use dedicated getter function.
  // See: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
} 