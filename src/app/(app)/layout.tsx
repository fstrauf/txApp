// import { AuthProvider } from '@/context/AuthContext'; // Removed import
import React from 'react';
import QueryProvider from '@/providers/QueryProvider'; // Import the new provider

// This layout wraps all routes inside the (app) group.
// AuthProvider is now likely in the root layout.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Wrap children with the QueryProvider
    <QueryProvider>
      {/* You might have other layout components here (e.g., Navbar, Sidebar) */}
      {children}
    </QueryProvider>
  );
} 