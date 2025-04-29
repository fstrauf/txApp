'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import PostHogProviderWrapper from '@/components/PostHogProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextAuthSessionProvider>
        <PostHogProviderWrapper>{children}</PostHogProviderWrapper>
      </NextAuthSessionProvider>
    </QueryClientProvider>
  );
} 