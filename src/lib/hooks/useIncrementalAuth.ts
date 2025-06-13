import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
}

const GOOGLE_TOKEN_STORAGE_KEY = 'google_sheets_tokens';

export const useIncrementalAuth = () => {
  const { data: session } = useSession();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasSpreadsheetAccess, setHasSpreadsheetAccess] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [storedTokens, setStoredTokens] = useState<GoogleTokens | null>(null);

  useEffect(() => {
    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google?.accounts?.oauth2) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();

    // Load stored tokens on component mount
    loadStoredTokens();
  }, []);

  // Load tokens from localStorage
  const loadStoredTokens = useCallback(() => {
    console.log('📂 Loading stored tokens from localStorage...');
    try {
      const stored = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
      console.log('📋 Raw stored tokens:', stored ? 'found' : 'not found');
      
      if (stored) {
        const tokens: GoogleTokens = JSON.parse(stored);
        console.log('📋 Parsed tokens:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresAt: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : 'none',
          scope: tokens.scope,
          isExpired: tokens.expires_at ? Date.now() >= tokens.expires_at : 'no expiry'
        });
        
        // Check if tokens are still valid (not expired)
        if (tokens.expires_at && Date.now() < tokens.expires_at) {
          console.log('✅ Tokens are still valid, using them');
          setStoredTokens(tokens);
          setHasSpreadsheetAccess(tokens.scope?.includes('spreadsheets') || false);
          return tokens;
        } else {
          console.log('⏰ Tokens expired, attempting refresh...');
          // Tokens expired, try to refresh if we have a refresh token
          if (tokens.refresh_token) {
            console.log('🔄 Refresh token found, refreshing...');
            refreshAccessToken(tokens.refresh_token);
          } else {
            console.warn('⚠️ No refresh token found, clearing storage');
            // No refresh token or expired, clear storage
            clearStoredTokens();
          }
        }
      } else {
        console.warn('⚠️ No stored tokens found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading stored Google tokens:', error);
      clearStoredTokens();
    }
    return null;
  }, []);

  // Store tokens in localStorage
  const storeTokens = useCallback((tokens: GoogleTokens) => {
    try {
      localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      setStoredTokens(tokens);
      setHasSpreadsheetAccess(tokens.scope?.includes('spreadsheets') || false);
    } catch (error) {
      console.error('Error storing Google tokens:', error);
    }
  }, []);

  // Clear stored tokens
  const clearStoredTokens = useCallback(() => {
    try {
      localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
      setStoredTokens(null);
      setHasSpreadsheetAccess(false);
    } catch (error) {
      console.error('Error clearing Google tokens:', error);
    }
  }, []);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      if (data.access_token) {
        const newTokens: GoogleTokens = {
          access_token: data.access_token,
          refresh_token: refreshToken, // Keep the existing refresh token
          expires_at: Date.now() + (data.expires_in * 1000), // expires_in is in seconds
          scope: data.scope || storedTokens?.scope || '',
        };
        
        storeTokens(newTokens);
        return data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      clearStoredTokens();
      return null;
    }
  }, [storedTokens?.scope, storeTokens, clearStoredTokens]);

  // Get valid access token (refresh if needed)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    console.log('🔑 getValidAccessToken called - checking stored tokens...');
    const tokens = loadStoredTokens();
    
    console.log('📋 Token status:', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      hasRefreshToken: !!tokens?.refresh_token,
      expiresAt: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : 'none',
      isExpired: tokens?.expires_at ? Date.now() >= tokens.expires_at : 'no expiry',
      currentTime: new Date().toISOString(),
      scope: tokens?.scope
    });
    
    if (!tokens) {
      console.warn('⚠️ No stored tokens found');
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (tokens.expires_at && Date.now() < (tokens.expires_at - bufferTime)) {
      console.log('✅ Using valid stored access token');
      return tokens.access_token;
    }

    console.log('🔄 Token expired or about to expire, attempting refresh...');
    // Token is expired or about to expire, try to refresh
    if (tokens.refresh_token) {
      console.log('🔄 Refresh token available, refreshing...');
      const refreshedToken = await refreshAccessToken(tokens.refresh_token);
      if (refreshedToken) {
        console.log('✅ Successfully refreshed access token');
        return refreshedToken;
      } else {
        console.error('❌ Failed to refresh access token');
      }
    } else {
      console.warn('⚠️ No refresh token available');
    }

    console.warn('❌ Unable to get valid access token');
    return null;
  }, [loadStoredTokens, refreshAccessToken]);

  // Check if user already has spreadsheet permissions
  const checkSpreadsheetAccess = useCallback(() => {
    // First check stored tokens - need both spreadsheets and drive.file for creating new spreadsheets
    if (storedTokens?.scope?.includes('spreadsheets') && storedTokens?.scope?.includes('drive.file')) {
      return true;
    }

    // Fallback to session scope (NextAuth)
    const scopes = (session as any)?.scope as string;
    return (scopes?.includes('https://www.googleapis.com/auth/spreadsheets') && 
            scopes?.includes('https://www.googleapis.com/auth/drive.file')) || false;
  }, [storedTokens, session]);

  // Request additional Google Sheets permissions
  const requestSpreadsheetAccess = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('requestSpreadsheetAccess called', {
        isGoogleLoaded,
        hasGoogle: !!window.google,
        hasOAuth2: !!window.google?.accounts?.oauth2,
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'configured' : 'missing',
        hasStoredTokens: !!storedTokens,
        tokenExpired: storedTokens ? Date.now() >= storedTokens.expires_at : false
      });

      // First try to get a valid stored token
      getValidAccessToken().then(token => {
        if (token) {
          console.log('Using stored/refreshed access token');
          resolve(token);
          return;
        }

        // No valid stored token, request new authorization
        if (!isGoogleLoaded || !window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services not loaded'));
          return;
        }

        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
          reject(new Error('Google Client ID not configured'));
          return;
        }

        setIsRequestingPermission(true);

        try {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
            callback: (response: any) => {
              console.log('OAuth callback response:', response);
              setIsRequestingPermission(false);
              if (response.error) {
                reject(new Error(response.error));
              } else {
                // Store the new tokens
                const newTokens: GoogleTokens = {
                  access_token: response.access_token,
                  expires_at: Date.now() + (response.expires_in * 1000),
                  scope: response.scope || 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
                };
                
                storeTokens(newTokens);
                resolve(response.access_token);
              }
            },
            error_callback: (error: any) => {
              console.error('OAuth error callback:', error);
              setIsRequestingPermission(false);
              reject(new Error(error.toString()));
            }
          });

          console.log('Requesting access token...');
          tokenClient.requestAccessToken({
            prompt: 'consent', // Force permission dialog
            // Request offline access to get refresh token
            access_type: 'offline',
          });
        } catch (error: any) {
          console.error('Error initializing token client:', error);
          setIsRequestingPermission(false);
          reject(new Error(`Failed to initialize Google OAuth: ${error.message}`));
        }
      }).catch(reject);
    });
  }, [isGoogleLoaded, storedTokens, getValidAccessToken, storeTokens]);

  // Function to manually clear stored auth (for logout/reset)
  const clearGoogleAuth = useCallback(() => {
    clearStoredTokens();
  }, [clearStoredTokens]);

  return {
    requestSpreadsheetAccess,
    isRequestingPermission,
    hasSpreadsheetAccess: hasSpreadsheetAccess || checkSpreadsheetAccess(),
    isSignedIn: !!session,
    isGoogleLoaded,
    storedTokens,
    clearGoogleAuth,
    getValidAccessToken
  };
}; 