'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGoogle, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast, Toaster } from 'react-hot-toast';
import type { UserSubscriptionData as SubscriptionDataType } from '@/lib/authUtils';
import ApiKeyManager from '@/app/api-key/ApiKeyManager';
import IntegrationsPageClientWrapper from './IntegrationsPageClientWrapper';
import { Suspense } from 'react';

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
  {
    name: 'Monarch Money',
    logo: '/monarchmoney_logo.png',
    alt: 'Monarch Money Logo',
    description: 'Coming soon! Join the waitlist for Monarch Money integration.',
    ctaType: 'waitlist',
    waitlistTag: 'monarch-waitlist',
  },
];

interface WaitlistFormState {
  showInput: boolean;
  email: string;
  isSubmitting: boolean;
  error: string;
  success: boolean;
}

function IntegrationsPageContent() {
  const [waitlistForms, setWaitlistForms] = useState<{ [key: string]: WaitlistFormState }>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'loading' | 'success' | 'warning' | 'error'>('loading');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionDataType | null>(null);

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

  useEffect(() => {
    console.log(`[Integrations Page Effect] Running. Session status: ${sessionStatus}`);
    let isMounted = true;

    const checkSubscriptionAndStartTrial = async () => {
      if (sessionStatus === 'authenticated' && isMounted) {
        console.log('[Integrations Page Effect] User authenticated. Checking subscription...');
        setIsLoadingStatus(true);
        setShowStatusBanner(true);
        setBannerType('loading');
        setStatusMessage('Checking your subscription status...');
        setSubscriptionData(null);

        try {
          const response = await fetch('/api/user-subscription');
          if (!isMounted) return;
          
          if (!response.ok) {
            throw new Error('Failed to fetch subscription status');
          }
          const subData: SubscriptionDataType = await response.json();
          const currentSub = {
              ...subData,
              currentPeriodEndsAt: subData.currentPeriodEndsAt ? new Date(subData.currentPeriodEndsAt) : null,
              trialEndsAt: subData.trialEndsAt ? new Date(subData.trialEndsAt) : null,
          };

          console.log('[Integrations Page Effect] Fetched subscription data:', currentSub);
          setSubscriptionData(currentSub);

          const now = Date.now();
          const isActiveSub = currentSub.subscriptionStatus === 'ACTIVE';
          const isActiveTrial = currentSub.trialEndsAt && currentSub.trialEndsAt.getTime() > now;
          const hasExpiredTrial = currentSub.trialEndsAt && currentSub.trialEndsAt.getTime() <= now;

          if (isActiveSub) {
            console.log('[Integrations Page Effect] Active subscription found.');
            setStatusMessage('Your subscription is active!');
            setBannerType('success');
          } else if (isActiveTrial) {
            console.log('[Integrations Page Effect] Active trial found.');
            setStatusMessage(`Your trial is active! (Ends: ${formatDate(currentSub.trialEndsAt)})`);
            setBannerType('success');
          } else if (hasExpiredTrial) {
            console.log('[Integrations Page Effect] Expired trial found.');
            setStatusMessage('Your free trial has expired.');
            setBannerType('warning');
          } else {
            console.log('[Integrations Page Effect] No trial/sub found. Attempting to start trial...');
            setStatusMessage('Starting your free trial...');

            const trialResponse = await fetch('/api/user/start-trial', { method: 'POST' });
            if (!isMounted) return;
            const trialData = await trialResponse.json();

            if (trialResponse.ok && trialData.success) {
              toast.success('Free trial started successfully!');
              setStatusMessage('Your 14-day free trial has started!');
              setBannerType('success');
              try {
                 const updatedResponse = await fetch('/api/user-subscription');
                 if (updatedResponse.ok && isMounted) {
                    const updatedSubData = await updatedResponse.json();
                     setSubscriptionData({
                         ...updatedSubData,
                         currentPeriodEndsAt: updatedSubData.currentPeriodEndsAt ? new Date(updatedSubData.currentPeriodEndsAt) : null,
                         trialEndsAt: updatedSubData.trialEndsAt ? new Date(updatedSubData.trialEndsAt) : null,
                     });
                     const newTrialEndDate = updatedSubData.trialEndsAt ? new Date(updatedSubData.trialEndsAt) : null;
                     if(newTrialEndDate) {
                         setStatusMessage(`Your 14-day free trial has started! (Ends: ${formatDate(newTrialEndDate)})`);
                     }
                 } 
              } catch(fetchError) {
                  console.error("Error fetching updated subscription data:", fetchError);
              }
            } else {
              console.error('Trial start API error:', trialData.error);
              toast.error(trialData.error || 'Failed to start trial.');
              setStatusMessage('Could not start free trial.');
              setBannerType('error');
            }
          }
        } catch (error) {
          if (!isMounted) return;
          console.error("[Integrations Page Effect] Error:", error);
          toast.error('An error occurred while checking status or starting trial.');
          setStatusMessage('Error checking status.');
          setBannerType('error');
        } finally {
          if (isMounted) {
             setIsLoadingStatus(false); 
          }
        }
      }
    };

    if (sessionStatus !== 'loading') { 
      checkSubscriptionAndStartTrial();
    } else {
      console.log(`[Integrations Page Effect] Session still loading...`);
    }
    
    return () => {
        isMounted = false;
    };
  }, [sessionStatus]);

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

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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

        {showStatusBanner && (
          <div className={`mb-8 p-4 border rounded-lg flex items-center justify-center max-w-2xl mx-auto shadow-sm ${ 
            bannerType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            bannerType === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
            bannerType === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {bannerType === 'success' && <FaCheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            {bannerType === 'warning' && <FaExclamationCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            {bannerType === 'error' && <FaExclamationCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
            {bannerType === 'loading' && <FaSpinner className="animate-spin h-5 w-5 mr-3 flex-shrink-0" />}
            
            <div className="text-center">
              <span>{statusMessage}</span>
              {bannerType === 'warning' && (
                 <Link href="/pricing" className="ml-2 underline font-medium">View Plans</Link>
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

        <div className="max-w-3xl mx-auto">
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