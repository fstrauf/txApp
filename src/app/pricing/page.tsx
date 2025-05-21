"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus';

interface StartTrialResponse {
  success: boolean;
  error?: string;
}

interface CheckoutResponse {
  url: string;
  error?: string;
}

interface CheckoutVariables {
  plan: string;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<{silver: boolean, gold: boolean}>({ silver: false, gold: false });
  
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { 
    subscriptionDetails, 
    isLoading: isLoadingSubscription, 
    error: subscriptionError, 
    refetchSubscriptionStatus 
  } = useSubscriptionStatus();

  const silverMonthly = 2;
  const goldMonthly = 10;
  const silverAnnual = silverMonthly * 12 * 0.8;
  const goldAnnual = goldMonthly * 12 * 0.8;

  const { mutate: startFreeTrial, isPending: isStartingTrial } = useMutation<StartTrialResponse, Error, void>({
    mutationFn: async (): Promise<StartTrialResponse> => {
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
      });
      const data: StartTrialResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start trial');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Free trial started successfully!');
      queryClient.invalidateQueries({ queryKey: ['userSubscriptionStatus'] });
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: ['accountInfo', session.user.id] });
      }
    },
    onError: (error: Error) => {
      console.error("Error starting free trial:", error);
      toast.error(`Failed to start trial: ${error.message}`);
    },
  });

  const handleStartFreeTrial = () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }
    startFreeTrial();
  };

  const { mutate: subscribeToPlan, isPending: isProcessingSubscription } = useMutation<CheckoutResponse, Error, CheckoutVariables>({
    mutationFn: async ({ plan }: CheckoutVariables): Promise<CheckoutResponse> => {
      setIsLoadingCheckout(prev => ({ ...prev, [plan.toLowerCase()]: true }));
      const response = await fetch(`/api/stripe/checkout?plan=${plan.toLowerCase()}&billing=${isAnnual ? "annual" : "monthly"}`);
      const data: CheckoutResponse = await response.json();
      if (!response.ok || !data.url) {
        setIsLoadingCheckout(prev => ({ ...prev, [plan.toLowerCase()]: false }));
        throw new Error(data.error || 'No checkout URL returned');
      }
      return data;
    },
    onSuccess: (data: CheckoutResponse) => {
      if (data.url) {
        window.location.href = data.url;
      }        
    },
    onError: (error: Error, variables: CheckoutVariables) => {
      console.error("Error creating checkout session:", error);
      toast.error(`Checkout failed: ${error.message}`);
      setIsLoadingCheckout(prev => ({ ...prev, [variables.plan.toLowerCase()]: false }));
    },
  });

  const handleSubscribe = (plan: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }
    subscribeToPlan({ plan });
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionDetails) return null;
    
    const plan = subscriptionDetails.subscriptionPlanName;
    const status = subscriptionDetails.apiSubscriptionStatus || '';
    
    let badgeColor = 'bg-gray-100 text-gray-800';
    
    if (plan === 'SILVER') badgeColor = 'bg-blue-100 text-blue-800';
    else if (plan === 'GOLD') badgeColor = 'bg-yellow-100 text-yellow-800';
    
    if (status === 'TRIALING' || subscriptionDetails.isActiveTrial) {
      badgeColor = 'bg-purple-100 text-purple-800';
    } else if (status === 'PAST_DUE') {
      badgeColor = 'bg-red-100 text-red-800';
    }
    
    if (plan === 'FREE' && !status && !subscriptionDetails.hasAnyActiveAccess) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Free Plan
        </span>
      );
    }
    
    if (!plan && !subscriptionDetails.hasAnyActiveAccess) return null;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {plan}{subscriptionDetails.isActiveTrial ? ' (Trial)' : ''}
      </span>
    );
  };

  const isPlanCurrentlyActive = (planName: string): boolean => {
    return !!subscriptionDetails && subscriptionDetails.hasAnyActiveAccess && subscriptionDetails.subscriptionPlanName === planName;
  };

  if (subscriptionError) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-default py-12">
            <Toaster position="bottom-center" />
            <p className="text-red-500 text-lg">Error loading subscription details: {subscriptionError.message}</p>
            <button onClick={() => refetchSubscriptionStatus()} className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
                Try Again
            </button>
        </div>
    );
  }

  return (
    <div className="bg-background-default min-h-screen py-12">
      <Toaster position="bottom-center" />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Choose the plan that best fits your needs. Get started with a free trial, no credit card required.
          </p>

          {session && !isLoadingSubscription && subscriptionDetails?.hasAnyActiveAccess && (
            <div className="mt-6 bg-white rounded-xl p-4 max-w-md mx-auto border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">Current Plan:</span>
                {getSubscriptionBadge()}
              </div>
              {subscriptionDetails.apiTrialEndsAt && (
                <p className="text-sm text-gray-700 mb-1">
                  Trial ends: {formatDate(subscriptionDetails.apiTrialEndsAt)}
                </p>
              )}
              {subscriptionDetails.isActivePaidPlan && subscriptionDetails.apiCurrentPeriodEndsAt && (
                <p className="text-sm text-gray-700">
                  Next billing: {formatDate(subscriptionDetails.apiCurrentPeriodEndsAt)}
                </p>
              )}
                      <p className="text-sm text-gray-700 mb-1 mt-6">
          You can find your API key on the <Link href="/api-key" className="text-blue-600 hover:underline font-medium">API Key page</Link>.
        </p>
            </div>
          )}
          
          {isLoadingSubscription && session && (
            <div className="mt-6 bg-white rounded-xl p-4 max-w-md mx-auto border border-gray-200 shadow-sm">
                <p className="text-center text-gray-600">Loading subscription details...</p>
            </div>
          )}

          <div className="flex items-center justify-center mt-8">
            <span className={`mr-3 text-sm ${!isAnnual ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-12 items-center rounded-full"
            >
              <span className={`${isAnnual ? 'bg-primary' : 'bg-gray-300'} flex h-6 w-12 items-center rounded-full p-1 transition-colors duration-300`}>
                <span className={`${isAnnual ? 'translate-x-6' : 'translate-x-0'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300`}></span>
              </span>
            </button>
            <span className={`ml-3 text-sm ${isAnnual ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Annual <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className={`bg-white rounded-2xl shadow-soft p-8 ${isPlanCurrentlyActive('SILVER') ? 'border-2 border-blue-400' : 'border border-gray-100'} flex flex-col`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Silver</h2>
                <p className="text-gray-600 mt-2">Perfect for personal budgeting</p>
              </div>
              {isPlanCurrentlyActive('SILVER') && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${isAnnual ? (silverAnnual/12).toFixed(2) : silverMonthly}</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">Billed annually (${silverAnnual.toFixed(2)})</p>
              )}
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">300 AI categorizations per month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Google Sheets integration</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Lunch Money integration</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Access to Financial Freedom Spreadsheet</span>
              </li>
            </ul>
            
            {isPlanCurrentlyActive('SILVER') ? (
              <button disabled className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed text-center">
                Current Plan
              </button>
            ) : !session ? (
              <button onClick={() => handleSubscribe('silver')} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center">
                Sign in to Subscribe
              </button>
            ) : (
              <button onClick={() => handleSubscribe('silver')} disabled={isLoadingCheckout.silver || isLoadingSubscription || isProcessingSubscription} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70">
                {isLoadingCheckout.silver || isProcessingSubscription ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </div>
          
          <div className={`bg-white rounded-2xl shadow-soft p-8 ${isPlanCurrentlyActive('GOLD') ? 'border-2 border-yellow-400' : 'border-2 border-primary/20'} flex flex-col relative overflow-hidden`}>
            <div className="absolute top-3 right-2 translate-x-[30%] translate-y-[-10%] rotate-45">
              <div className="bg-primary text-white text-xs px-8 py-1 shadow-md">
                Popular
              </div>
            </div>
            
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gold</h2>
                <p className="text-gray-600 mt-2">For serious budget management</p>
              </div>
              {isPlanCurrentlyActive('GOLD') && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${isAnnual ? (goldAnnual/12).toFixed(2) : goldMonthly}</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">Billed annually (${goldAnnual.toFixed(2)})</p>
              )}
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700"><strong>Unlimited</strong> AI categorizations</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Google Sheets integration</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Access to Financial Freedom Spreadsheet</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Early access to new features</span>
              </li>
            </ul>
            
            {isLoadingSubscription ? (
                 <button disabled className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed text-center">
                    Loading...
                 </button>
            ) : isPlanCurrentlyActive('GOLD') ? (
              <button disabled className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed text-center">
                Current Plan
              </button>
            ) : !session ? (
                <button onClick={() => handleSubscribe('gold')} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center">
                  Sign in to Subscribe
                </button>
            ) : subscriptionDetails?.canStartNewTrial ? ( 
              <button onClick={handleStartFreeTrial} disabled={isStartingTrial} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70">
                {isStartingTrial ? 'Starting Trial...' : "Start 14-Day Free Trial"}
              </button>
            ) : (
              <button onClick={() => handleSubscribe('gold')} disabled={isLoadingCheckout.gold || isProcessingSubscription} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70">
                {isLoadingCheckout.gold || isProcessingSubscription ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </div>
        </div>
        
        {(!session || (subscriptionDetails && subscriptionDetails.canStartNewTrial && !subscriptionDetails.hasAnyActiveAccess)) && (
          <div className="mt-12 text-center">
            <button 
              onClick={handleStartFreeTrial} 
              disabled={isStartingTrial || isLoadingSubscription} 
              className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg disabled:opacity-70"
            >
              {isLoadingSubscription ? 'Loading...' : isStartingTrial ? 'Starting Trial...' : "Start 14-Day Free Trial"}
            </button>
          </div>
        )}
        
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">How does the free trial work?</h3>
            <p className="text-gray-700">When you sign up, you'll get 14 days to try out all Gold tier features without providing payment information. After the trial ends, you can choose a plan or continue with limited features.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-700">Yes, you can change your subscription at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change will take effect at the end of your current billing cycle.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happens if I exceed my monthly categorizations on the Silver plan?</h3>
            <p className="text-gray-700">If you reach your 20 categorization limit on the Silver plan, you'll need to wait until the next billing cycle or upgrade to Gold for unlimited categorizations.</p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need help choosing a plan? <Link href="/support" className="text-primary hover:underline">Contact our team</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 