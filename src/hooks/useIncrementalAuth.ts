import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export const useIncrementalAuth = () => {
  const { data: session } = useSession();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasSpreadsheetAccess, setHasSpreadsheetAccess] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

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
  }, []);

  // Check if user already has spreadsheet permissions
  const checkSpreadsheetAccess = () => {
    const scopes = (session as any)?.scope as string;
    return scopes?.includes('https://www.googleapis.com/auth/spreadsheets') || false;
  };

  // Request additional Google Sheets permissions
  const requestSpreadsheetAccess = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('requestSpreadsheetAccess called', {
        isGoogleLoaded,
        hasGoogle: !!window.google,
        hasOAuth2: !!window.google?.accounts?.oauth2,
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'configured' : 'missing'
      });

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
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
          callback: (response: any) => {
            console.log('OAuth callback response:', response);
            setIsRequestingPermission(false);
            if (response.error) {
              reject(new Error(response.error));
            } else {
              setHasSpreadsheetAccess(true);
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
          prompt: 'consent' // Force permission dialog
        });
      } catch (error: any) {
        console.error('Error initializing token client:', error);
        setIsRequestingPermission(false);
        reject(new Error(`Failed to initialize Google OAuth: ${error.message}`));
      }
    });
  };

  return {
    requestSpreadsheetAccess,
    isRequestingPermission,
    hasSpreadsheetAccess: hasSpreadsheetAccess || checkSpreadsheetAccess(),
    isSignedIn: !!session,
    isGoogleLoaded
  };
}; 