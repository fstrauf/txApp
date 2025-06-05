'use client';

import { useSession } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { useIsPersonalFinancePage } from '@/hooks/useNavigationConfig';

export function ClientSidebarWrapper() {
  const { status } = useSession();
  const isPersonalFinancePage = useIsPersonalFinancePage();

  // Don't render sidebar for personal finance pages (they have their own specialized sidebar)
  if (isPersonalFinancePage) {
    return null;
  }

  // Render the Sidebar only if the client-side session status is authenticated
  if (status === 'authenticated') {
    return <Sidebar />;
  }

  // Otherwise, render nothing
  return null;
} 