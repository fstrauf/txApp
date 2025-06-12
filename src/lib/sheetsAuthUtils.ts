import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

/**
 * Centralized utility for handling Google Sheets authentication
 * Ensures consistent token handling across all components
 */
export const ensureGoogleSheetsAccess = async (requestSpreadsheetAccess: () => Promise<string>): Promise<string> => {
  try {
    console.log('🔑 Ensuring Google Sheets access...');
    const accessToken = await requestSpreadsheetAccess();
    
    if (!accessToken) {
      throw new Error('Unable to get valid Google access token. Please grant access to Google Sheets and try again.');
    }
    
    console.log('✅ Google Sheets access confirmed');
    return accessToken;
  } catch (error) {
    console.error('❌ Error getting Google Sheets access:', error);
    throw error;
  }
};

/**
 * Hook that provides centralized Google Sheets authentication
 */
export const useGoogleSheetsAuth = () => {
  const { requestSpreadsheetAccess } = useIncrementalAuth();
  
  const ensureAccess = async (): Promise<string> => {
    return ensureGoogleSheetsAccess(requestSpreadsheetAccess);
  };
  
  return { ensureAccess };
}; 