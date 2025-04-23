// import { AuthProvider } from '@/context/AuthContext'; // Removed import
import React from 'react';

// This layout wraps all routes inside the (app) group.
// AuthProvider is now likely in the root layout.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* You might have other layout components here (e.g., Navbar, Sidebar) */}
      {children}
    </>
  );
} 