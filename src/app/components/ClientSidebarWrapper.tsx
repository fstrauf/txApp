'use client';

import { useSession } from 'next-auth/react';
import { Sidebar } from './Sidebar';

export function ClientSidebarWrapper() {
  const { status } = useSession();

  // Render the Sidebar only if the client-side session status is authenticated
  if (status === 'authenticated') {
    return <Sidebar />;
  }

  // Otherwise, render nothing
  return null;
} 