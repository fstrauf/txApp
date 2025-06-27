import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const useDashboardState = () => {
  const { data: session, status } = useSession();
  
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'portfolio' | 'ai-insights'>('overview');
  const [dataManagementDefaultTab, setDataManagementDefaultTab] = useState<'manage' | 'upload' | 'validate' | 'settings'>('manage');
  const [userToastStatus, setUserToastStatus] = useState<string | null>(null);
  const [showExitSurvey, setShowExitSurvey] = useState(false);

  // Fetch user's monthly reminder toast status
  useEffect(() => {
    const fetchToastStatus = async () => {
      if (session?.user?.email) {
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
          } else {
            console.error('Failed to fetch toast status:', response.statusText);
          }
        } catch (error) {
          console.error('Failed to fetch toast status:', error);
        }
      }
    };

    fetchToastStatus();
  }, [session?.user?.email]);

  // Ensure drawers are closed when dashboard loads
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
    setDataManagementDefaultTab,
    userToastStatus,
    setUserToastStatus,
    showExitSurvey,
    setShowExitSurvey,
  };
}; 