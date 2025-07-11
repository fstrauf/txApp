import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthenticationBarrier } from './useAuthenticationBarrier';

export const useDashboardState = () => {
  const { data: session, status } = useSession();
  const { isAuthenticated, isReady } = useAuthenticationBarrier();
  
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'portfolio' | 'ai-insights'>('overview');
  const dataManagementDefaultTab: 'upload' | 'validate' | 'settings' = 'upload';
  const [userToastStatus, setUserToastStatus] = useState<string | null>(null);
  const [showExitSurvey, setShowExitSurvey] = useState(false);

  // Use ref to prevent duplicate API calls
  const hasLoadedToastStatus = useRef(false);

  // Fetch user's monthly reminder toast status - only when auth is ready and stable
  useEffect(() => {
    const fetchToastStatus = async () => {
      if (!isReady || !isAuthenticated || hasLoadedToastStatus.current) return;
      
      hasLoadedToastStatus.current = true;
      
      try {
        const response = await fetch('/api/user/monthly-reminder-toast', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserToastStatus(data.status);
        }
      } catch (error) {
        // Silently fail - this is not critical functionality
        console.warn('Failed to fetch toast status:', error);
      }
    };

    fetchToastStatus();
  }, [isReady, isAuthenticated]);

  // Reset loading flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedToastStatus.current = false;
      setUserToastStatus(null);
    }
  }, [isAuthenticated]);

  // Ensure drawers are closed when dashboard loads - only once
  useEffect(() => {
    setIsHelpDrawerOpen(false);
    setIsHowItWorksOpen(false);
  }, []);

  return {
    session,
    status,
    isHelpDrawerOpen,
    setIsHelpDrawerOpen,
    isHowItWorksOpen,
    setIsHowItWorksOpen,
    activeTab,
    setActiveTab,
    dataManagementDefaultTab,
    userToastStatus,
    setUserToastStatus,
    showExitSurvey,
    setShowExitSurvey,
  };
}; 