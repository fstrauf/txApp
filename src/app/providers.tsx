'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import PostHogProviderWrapper from '@/components/PostHogProvider';
import PostSignupSurvey from '@/components/shared/PostSignupSurvey';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <PostHogProviderWrapper>
        {children}
        <PostSignupSurvey />
      </PostHogProviderWrapper>
    </NextAuthSessionProvider>
  );
} 