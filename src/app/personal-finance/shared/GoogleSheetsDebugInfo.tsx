'use client';

import React from 'react';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

export const GoogleSheetsDebugInfo: React.FC = () => {
  const { isGoogleLoaded, isSignedIn } = useIncrementalAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
      <div className="font-semibold mb-2">🔧 Debug Info (Development Only):</div>
      <div className="space-y-1">
        <div>Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing'}</div>
        <div>Google Services Loaded: {isGoogleLoaded ? '✅ Yes' : '❌ No'}</div>
        <div>User Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</div>
        <div>Google Global Object: {typeof window !== 'undefined' && window.google ? '✅ Available' : '❌ Missing'}</div>
        <div>OAuth2 API: {typeof window !== 'undefined' && window.google?.accounts?.oauth2 ? '✅ Available' : '❌ Missing'}</div>
      </div>
      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="font-semibold">Missing Configuration:</div>
          <div>Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file</div>
        </div>
      )}
    </div>
  );
}; 