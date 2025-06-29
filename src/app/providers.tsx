'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import PostHogProviderWrapper from '@/components/PostHogProvider';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <PostHogProviderWrapper>
        {children}
      </PostHogProviderWrapper>
    </NextAuthSessionProvider>
  );
} 