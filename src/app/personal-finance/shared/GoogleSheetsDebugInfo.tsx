'use client';

import React from 'react';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

export const GoogleSheetsDebugInfo: React.FC = () => {
  const { isGoogleLoaded, isSignedIn, hasSpreadsheetAccess, storedTokens, clearGoogleAuth } = useIncrementalAuth();

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
        <div>Sheets Access: {hasSpreadsheetAccess ? '✅ Authorized' : '❌ Not Authorized'}</div>
        <div>Stored Tokens: {storedTokens ? '✅ Available' : '❌ None'}</div>
        {storedTokens && (
          <div className="text-xs">
            <div>Token Expires: {new Date(storedTokens.expires_at).toLocaleString()}</div>
            <div>Has Refresh Token: {storedTokens.refresh_token ? '✅ Yes' : '❌ No'}</div>
          </div>
        )}
        <div>Google Global Object: {typeof window !== 'undefined' && window.google ? '✅ Available' : '❌ Missing'}</div>
        <div>OAuth2 API: {typeof window !== 'undefined' && window.google?.accounts?.oauth2 ? '✅ Available' : '❌ Missing'}</div>
      </div>
      {storedTokens && (
        <div className="mt-3">
          <button
            onClick={clearGoogleAuth}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
          >
            Clear Google Auth
          </button>
        </div>
      )}
      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="font-semibold">Missing Configuration:</div>
          <div>Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file</div>
        </div>
      )}
    </div>
  );
}; 