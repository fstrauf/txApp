"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component

const LOCAL_STORAGE_KEY = 'appBetaPopupInteracted';

type BetaStatus = 'OPTED_IN' | 'DISMISSED' | null;

export default function AppBetaPopup() {
  const { data: session, status: sessionStatus } = useSession();
  const [betaStatus, setBetaStatus] = useState<BetaStatus>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // State for anonymous email collection
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false); // Optional: for success message

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
         // Reset email form state when popup might reopen
        setShowEmailInput(false);
        setEmail("");
        setEmailError("");
        setEmailSuccess(false);
        setIsOpen(true);
      }
      setIsCheckingStatus(false);
    };

    checkStatus();

  }, [session, sessionStatus]);

  const handleUpdateStatus = async (newStatus: 'OPTED_IN' | 'DISMISSED') => {
    setIsLoading(true); // Loading state for the initial button click

    if (session?.user) {
      // Logged-in user: Update via API (existing logic)
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
        // Show the email input form instead of closing
        setShowEmailInput(true);
      }
    }

    setIsLoading(false);
  };

  // New handler for submitting email for anonymous users
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingEmail(true);
    setEmailError("");
    setEmailSuccess(false);

    if (!email) {
      setEmailError("Please enter a valid email address.");
      setIsSubmittingEmail(false);
      return;
    }

    try {
      const response = await fetch("/api/createEmailContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email,
          source: "BETA_ACCESS", // Use specific source
          tags: ["beta-opt-in"]  // Use specific tag
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true'); // Set flag on success
        setEmailSuccess(true); // Show success message briefly
        // Close popup after a short delay
        setTimeout(() => {
          setIsOpen(false);
        }, 1500); 
      } else {
        setEmailError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Don't render anything while checking status or if the popup shouldn't be open
  if (isCheckingStatus || !isOpen || (session?.user && (betaStatus === 'OPTED_IN' || betaStatus === 'DISMISSED'))) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200">
        {/* Conditional Rendering: Initial Prompt vs Email Form */}
        {!showEmailInput ? (
          // Initial Prompt Content
          <>
            <h2 className="text-xl font-semibold mb-4">New App Version Coming Soon!</h2>
            <p className="mb-6 text-gray-700">
              We're building an exciting new version of the app. Would you like to be notified when it's available for beta testing?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('DISMISSED')}
                disabled={isLoading}
              >
                {isLoading ? '...' : 'No, Thanks'} 
              </Button>
              <Button
                onClick={() => handleUpdateStatus('OPTED_IN')}
                disabled={isLoading}
              >
                {isLoading ? '...' : 'Yes, Notify Me!'}
              </Button>
            </div>
          </>
        ) : emailSuccess ? (
            // Success Message after email submit
            <p className="text-green-600">Thanks! We'll keep you updated.</p>
        ) : (
          // Email Input Form for Anonymous Users
          <form onSubmit={handleEmailSubmit} className="space-y-4">
             <h2 className="text-xl font-semibold mb-2">Get Notified!</h2>
             <p className="text-sm text-gray-600 mb-4">Enter your email to receive updates about the beta.</p>
             <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={isSubmittingEmail}
                  className="w-full"
                />
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
             </div>
             <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingEmail}
                  className="w-full"
                >
                  {isSubmittingEmail ? 'Submitting...' : 'Submit Email'}
                </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 