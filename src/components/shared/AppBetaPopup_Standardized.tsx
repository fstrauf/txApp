"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EmailSignupForm from "./EmailSignupForm";

const LOCAL_STORAGE_KEY = 'appBetaPopupInteracted';

type BetaStatus = 'OPTED_IN' | 'DISMISSED' | null;

export default function AppBetaPopup() {
  const { data: session, status: sessionStatus } = useSession();
  const [betaStatus, setBetaStatus] = useState<BetaStatus>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true);
      if (sessionStatus === 'loading') {
        setIsCheckingStatus(false); 
        return; 
      }

      let currentStatus: BetaStatus = null;
      let interactedLocally = false;

      if (session?.user) {
        try {
          const res = await fetch('/api/account/beta-status');
          if (res.ok) {
            const data = await res.json();
            currentStatus = data.appBetaOptIn;
          } else {
            console.error('Failed to fetch beta status');
          }
        } catch (error) {
          console.error('Error fetching beta status:', error);
        }
      } else {
        interactedLocally = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
      }

      setBetaStatus(currentStatus);
      
      if ((session?.user && currentStatus === null) || (!session?.user && !interactedLocally)) {
        setShowEmailInput(false);
        setIsOpen(true);
      }
      setIsCheckingStatus(false);
    };

    checkStatus();
  }, [session, sessionStatus]);

  const handleUpdateStatus = async (newStatus: 'OPTED_IN' | 'DISMISSED') => {
    setIsLoading(true);

    if (session?.user) {
      // Logged-in user: Update via API
      try {
        const res = await fetch('/api/account/beta-opt-in', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setBetaStatus(newStatus);
          setIsOpen(false);
        } else {
          console.error('Failed to update beta status');
        }
      } catch (error) {
        console.error('Error updating beta status:', error);
      }
    } else {
      // Anonymous user:
      if (newStatus === 'DISMISSED') {
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        setBetaStatus(newStatus);
        setIsOpen(false);
      } else if (newStatus === 'OPTED_IN') {
        setShowEmailInput(true);
      }
    }

    setIsLoading(false);
  };

  const handleEmailSuccess = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  };

  // Don't render anything while checking status or if the popup shouldn't be open
  if (isCheckingStatus || !isOpen || (session?.user && (betaStatus === 'OPTED_IN' || betaStatus === 'DISMISSED'))) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200">
        {!showEmailInput ? (
          // Initial Prompt Content
          <>
            <h2 className="text-xl font-semibold mb-4">New App Version Coming Soon!</h2>
            <p className="mb-6 text-gray-700">
              We're building an exciting new version of the app. Would you like to be notified when it's available for beta testing?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleUpdateStatus('DISMISSED')}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? '...' : 'No, Thanks'} 
              </button>
              <button
                onClick={() => handleUpdateStatus('OPTED_IN')}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? '...' : 'Yes, Notify Me!'}
              </button>
            </div>
          </>
        ) : (
          // Email Input Form using standardized component
          <EmailSignupForm
            source="BETA_ACCESS"
            tags={["beta-opt-in"]}
            title="Get Notified!"
            description="Enter your email to receive updates about the beta."
            successMessage="Thanks! We'll keep you updated."
            onSuccess={handleEmailSuccess}
            buttonText="Submit Email"
            className="space-y-4"
          />
        )}
      </div>
    </div>
  );
}
