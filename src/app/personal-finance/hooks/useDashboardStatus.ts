import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardStatusData {
  spreadsheetUrl: string | null;
  spreadsheetId: string | null;
  lastDataRefresh: Date | null;
  emailRemindersEnabled: boolean;
  hasSpreadsheet: boolean;
  stats: any;
}

export const useDashboardStatus = () => {
  const { data: session } = useSession();
  const [status, setStatus] = useState<DashboardStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('🚫 No user session, skipping dashboard status check');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Checking dashboard status...');
    
    try {
      const response = await fetch('/api/dashboard/status');
      const data = await response.json();
      
      console.log('📊 Dashboard status response:', {
        status: response.status,
        ok: response.ok,
        spreadsheetUrl: data.spreadsheetUrl,
        hasStats: !!data.stats
      });
      
      if (response.ok) {
        setStatus(data);
        return data;
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard status');
      }
    } catch (error: any) {
      console.error('❌ Error checking dashboard status:', error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Auto-check status when session changes
  useEffect(() => {
    if (session?.user?.id) {
      checkStatus();
    }
  }, [session?.user?.id, checkStatus]);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    clearError: () => setError(null)
  };
}; 