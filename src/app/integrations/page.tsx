'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGoogle, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus';
import ApiKeyManager from '@/app/api-key/ApiKeyManager';
import IntegrationsPageClientWrapper from './IntegrationsPageClientWrapper';
import type { UserSubscriptionData as SubscriptionDataType } from '@/lib/authUtils';

interface Platform {
  name: string;
  logo: string;
  alt: string;
  description: string;
  ctaType: 'link' | 'waitlist';
  ctaLink?: string;
  waitlistTag?: 'pocketsmith-waitlist' | 'monarch-waitlist';
}

const platformsData: Platform[] = [
  {
    name: 'Google Sheets',
    logo: '/Google_Sheets_2020_Logo.png',
    alt: 'Google Sheets Logo',
    description: 'Automate categorization directly in your spreadsheets.',
    ctaType: 'link',
    ctaLink: 'https://workspace.google.com/marketplace/app/expense_sorted/456363921097',
  },
  {
    name: 'Tiller',
    logo: '/Tiller Logo 2021.svg',
    alt: 'Tiller Logo',
    description: 'Connect your Tiller spreadsheet for AI categorization.',
    ctaType: 'link',
    ctaLink: 'https://workspace.google.com/marketplace/app/expense_sorted/456363921097',
  },
  {
    name: 'Lunch Money',
    logo: '/lunchmoney.png',
    alt: 'Lunch Money Logo',
    description: 'Connect your Lunch Money account for AI-powered sorting.',
    ctaType: 'link',
    ctaLink: '/lunchmoney',
  },
  {
    name: 'PocketSmith',
    logo: '/PocketsmithLogo.png',
    alt: 'PocketSmith Logo',
    description: 'Coming soon! Join the waitlist for PocketSmith integration.',
    ctaType: 'waitlist',
    waitlistTag: 'pocketsmith-waitlist',
  },
  // {
  //   name: 'Monarch Money',
  //   logo: '/monarchmoney_logo.png',
  //   alt: 'Monarch Money Logo',
  //   description: 'Coming soon! Join the waitlist for Monarch Money integration.',
  //   ctaType: 'waitlist',
  //   waitlistTag: 'monarch-waitlist',
  // },
];

interface WaitlistFormState {
  showInput: boolean;
  email: string;
  isSubmitting: boolean;
  error: string;
  success: boolean;
}

// Copied from PricingPage for consistency - consider moving to a shared types file if used in more places
interface StartTrialResponse {
  success: boolean;
  error?: string;
  trialEndsAt?: string; // Expecting trial end date from API upon successful trial start
}

function IntegrationsPageContent() {
  const [waitlistForms, setWaitlistForms] = useState<{ [key: string]: WaitlistFormState }>({});
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();

  const {
    subscriptionDetails,
    isLoading: isLoadingSubscriptionStatus,
    error: subscriptionError,
    // refetchSubscriptionStatus // Available if needed
  } = useSubscriptionStatus();

  const { mutate: startFreeTrial, isPending: isStartingTrial, data: trialMutationData } = useMutation<StartTrialResponse, Error, void>({
    mutationFn: async (): Promise<StartTrialResponse> => {
      const response = await fetch('/api/user/start-trial', { method: 'POST' });
      const data: StartTrialResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start trial');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success('Free trial started successfully!');
      queryClient.invalidateQueries({ queryKey: ['userSubscriptionStatus'] });
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: ['accountInfo', session.user.id] });
      }
      // Potentially use data.trialEndsAt here if needed immediately for the banner
    },
    onError: (error: Error) => {
      console.error('Trial start API error:', error);
      // Avoid duplicate toasts if the error is specifically about trial already used.
      if (!error.message.toLowerCase().includes('trial already activated or used')) {
        toast.error(error.message || 'Failed to start trial.');
      }
    },
  });

  // Effect to automatically try starting a trial if user is authenticated,
  // has no active subscription/trial, and can start a new trial.
  useEffect(() => {
    // Wait until loading is complete and no trial is currently being started.
    if (isLoadingSubscriptionStatus || isStartingTrial) {
      return; 
    }

    // Proceed only if authenticated and subscriptionDetails are available.
    if (sessionStatus === 'authenticated' && subscriptionDetails) {
      if (!subscriptionDetails.hasAnyActiveAccess && subscriptionDetails.canStartNewTrial) {
        console.log('[Integrations Page Effect] Conditions met. Attempting to start trial...');
        startFreeTrial();
      }
    }
  }, [
    sessionStatus,
    subscriptionDetails,
    isLoadingSubscriptionStatus, 
    isStartingTrial,             
    startFreeTrial               
  ]);
  

  useEffect(() => {
    const initialState: { [key: string]: WaitlistFormState } = {};
    platformsData.forEach(p => {
      if (p.ctaType === 'waitlist' && p.waitlistTag) {
        initialState[p.waitlistTag] = {
          showInput: false,
          email: '',
          isSubmitting: false,
          error: '',
          success: false,
        };
      }
    });
    setWaitlistForms(initialState);
  }, []);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Determine banner state based on subscriptionDetails and mutation states
  let bannerType: 'loading' | 'success' | 'warning' | 'error' | null = null;
  let statusMessage: string | null = null;
  let showStatusBanner = false;

  if (isLoadingSubscriptionStatus || (sessionStatus === 'authenticated' && isStartingTrial && !subscriptionDetails?.hasAnyActiveAccess)) {
    bannerType = 'loading';
    statusMessage = isLoadingSubscriptionStatus ? 'Checking your subscription status...' : 'Starting your free trial...';
    showStatusBanner = true;
  } else if (subscriptionError) {
    bannerType = 'error';
    // Display a generic error, specific trial error is handled by mutation's onError toast.
    statusMessage = `Error loading subscription details.`; 
    showStatusBanner = true;
  } else if (sessionStatus === 'authenticated' && subscriptionDetails) {
    if (subscriptionDetails.isActivePaidPlan) {
      bannerType = 'success';
      statusMessage = 'Your subscription is active!';
      showStatusBanner = true;
    } else if (subscriptionDetails.isActiveTrial) {
      bannerType = 'success';
      statusMessage = `Your trial is active! (Ends: ${formatDate(subscriptionDetails.apiTrialEndsAt)})`;
      showStatusBanner = true;
    } else if (subscriptionDetails.apiTrialEndsAt && subscriptionDetails.apiTrialEndsAt.getTime() <= Date.now() && !subscriptionDetails.isActivePaidPlan) { // Expired trial
      bannerType = 'warning';
      statusMessage = 'Your free trial has expired.';
      showStatusBanner = true;
    } else if (isStartingTrial) { // Trial is being started, but not yet reflected in subscriptionDetails
        bannerType = 'loading';
        statusMessage = 'Starting your free trial...';
        showStatusBanner = true;
    } else if (trialMutationData?.success && trialMutationData.trialEndsAt && !subscriptionDetails.isActiveTrial && !subscriptionDetails.isActivePaidPlan) {
        bannerType = 'success';
        statusMessage = `Your 14-day free trial has started! (Ends: ${formatDate(new Date(trialMutationData.trialEndsAt))})`;
        showStatusBanner = true;
    } else if (!subscriptionDetails.hasAnyActiveAccess && !subscriptionDetails.canStartNewTrial && !isStartingTrial) {
      // User is authenticated, has no active access, cannot start a new trial (already used), and no trial is pending.
      // This might happen if the API for /user-subscription correctly reflects an expired/used trial
      // that `getUserSubscriptionStatusDetails` interprets as canStartNewTrial = false.
      // This could be a more specific state like "Free plan, trial used."
      // For now, if it doesn't fall into other categories, no specific banner is shown here,
      // relying on other UI elements (like pricing page links) to guide the user.
    }
    // If none of the above, and user is authenticated but has no active access and can't start a new trial (e.g. already used), no specific banner might be needed
    // or a generic message could be shown.
  }
  
  const handleShowWaitlistInput = (tag: string) => {
    setWaitlistForms(prev => ({
      ...prev,
      [tag]: { ...prev[tag], showInput: true },
    }));
  };

  const handleEmailChange = (tag: string, email: string) => {
    setWaitlistForms(prev => ({
      ...prev,
      [tag]: { ...prev[tag], email: email, error: '' },
    }));
  };

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>, tag: string) => {
    e.preventDefault();
    const formState = waitlistForms[tag];
    if (!formState || formState.isSubmitting) return;

    setWaitlistForms(prev => ({ ...prev, [tag]: { ...prev[tag], isSubmitting: true, error: '', success: false } }));

    if (!formState.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setWaitlistForms(prev => ({ ...prev, [tag]: { ...prev[tag], error: 'Please enter a valid email.', isSubmitting: false } }));
      return;
    }

    try {
      const response = await fetch('/api/createEmailContact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
          source: 'OTHER',
          tags: [tag]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWaitlistForms(prev => ({ ...prev, [tag]: { ...prev[tag], success: true, isSubmitting: false } }));
      } else {
        setWaitlistForms(prev => ({ ...prev, [tag]: { ...prev[tag], error: data.error || 'Failed to subscribe.', isSubmitting: false } }));
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setWaitlistForms(prev => ({ ...prev, [tag]: { ...prev[tag], error: 'Something went wrong.', isSubmitting: false } }));
    }
  };

  return (
    <div className="min-h-screen bg-background-default py-12 md:py-20">
      <Toaster position="bottom-center" />
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Connect Your Tools
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            Choose your preferred platform below to get started with AI-powered expense categorization.
          </p>
        </div>

        {showStatusBanner && bannerType && (
          <div className={`mb-8 p-4 border rounded-lg flex items-center justify-center max-w-2xl mx-auto shadow-sm ${ 
            bannerType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            bannerType === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
            bannerType === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800' // loading
          }`}>
            {bannerType === 'success' && <FaCheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            {(bannerType === 'warning' || bannerType === 'error') && <FaExclamationCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            {bannerType === 'loading' && <FaSpinner className="animate-spin h-5 w-5 mr-3 flex-shrink-0" />}
            
            <div className="text-center">
              <span>{statusMessage}</span>
              {bannerType === 'warning' && (
                 <Link href="/pricing" className="ml-2 underline font-medium">View Plans</Link>
              )}
              {/* Link to API key section added in previous step, ensure it's still relevant with new state logic */}
              {bannerType === 'success' && (subscriptionDetails?.isActiveTrial || subscriptionDetails?.isActivePaidPlan) && (
                <a href="#api-key-section" className="ml-2 underline font-medium">Get your API Key</a>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {platformsData.map((platform) => {
            const currentWaitlistState = platform.waitlistTag ? waitlistForms[platform.waitlistTag] : undefined;

            return (
              <div key={platform.name} className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 flex flex-col items-center text-center transition-shadow hover:shadow-md">
                <div className="h-16 flex items-center justify-center mb-4">
                  <Image
                    src={platform.logo}
                    alt={platform.alt}
                    width={platform.name === 'PocketSmith' ? 120 : 60}
                    height={60}
                    className="max-h-14 w-auto rounded-md object-contain"
                    priority={false}
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{platform.name}</h2>
                <p className="text-gray-600 mb-5 flex-grow min-h-[40px]">{platform.description}</p>

                <div className="mt-auto w-full max-w-xs mx-auto">
                  {platform.ctaType === 'link' && platform.ctaLink && (
                    <Link
                      href={platform.ctaLink}
                      target={platform.ctaLink.startsWith('http') ? '_blank' : '_self'}
                      rel={platform.ctaLink.startsWith('http') ? 'noopener noreferrer' : ''}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-sm w-full"
                    >
                      {platform.name === 'Google Sheets' ? <FaGoogle className="mr-2" /> : null}
                      Get Started
                    </Link>
                  )}

                  {platform.ctaType === 'waitlist' && platform.waitlistTag && currentWaitlistState && (
                    <>
                      {!currentWaitlistState.showInput && !currentWaitlistState.success && (
                        <button
                          onClick={() => handleShowWaitlistInput(platform.waitlistTag!)}
                          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-secondary text-white font-semibold hover:bg-secondary-dark transition-all duration-200 shadow-sm w-full"
                        >
                          Join Waitlist
                        </button>
                      )}

                      {currentWaitlistState.showInput && !currentWaitlistState.success && (
                        <form onSubmit={(e) => handleWaitlistSubmit(e, platform.waitlistTag!)} className="space-y-3">
                          <input
                            type="email"
                            value={currentWaitlistState.email}
                            onChange={(e) => handleEmailChange(platform.waitlistTag!, e.target.value)}
                            placeholder="your.email@example.com"
                            required
                            aria-label={`Email for ${platform.name} waitlist`}
                            disabled={currentWaitlistState.isSubmitting}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
                          />
                          {currentWaitlistState.error && <p className="text-red-500 text-xs text-left mt-1">{currentWaitlistState.error}</p>}
                          <button
                            type="submit"
                            disabled={currentWaitlistState.isSubmitting}
                            className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-secondary text-white font-semibold hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            {currentWaitlistState.isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : null}
                            {currentWaitlistState.isSubmitting ? 'Submitting...' : 'Notify Me'}
                          </button>
                        </form>
                      )}

                      {currentWaitlistState.success && (
                        <p className="text-green-600 font-medium text-center text-sm bg-green-50 border border-green-100 rounded-lg py-2 px-3">
                          Thanks! We'll notify you.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <hr className="my-12 md:my-16 border-gray-200" />

        <div className="max-w-3xl mx-auto" id="api-key-section">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Expense Sorted API Key</h2>
            <p className="text-gray-600">
              Use this key to connect integrations like the Google Sheets Add-on.
            </p>
          </div>
          
          {sessionStatus === 'authenticated' && session?.user?.id ? (
            <ApiKeyManager userId={session.user.id} />
          ) : sessionStatus === 'loading' ? (
            <div className="text-center text-gray-500">Loading user data...</div>
          ) : (
            <div className="text-center text-gray-500 bg-gray-50 p-6 rounded-lg border border-gray-200">
              Please <Link href="/auth/signin?callbackUrl=/integrations" className="text-primary underline">sign in</Link> to view or generate your API key.
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <IntegrationsPageClientWrapper>
      <Suspense fallback={<div>Loading Integrations...</div>}>
        <IntegrationsPageContent />
      </Suspense>
    </IntegrationsPageClientWrapper>
  );
} 