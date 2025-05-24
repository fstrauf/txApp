"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserSubscriptionStatusDetails, type SubscriptionStatusDetails, type UserSubscriptionData } from '@/lib/authUtils';
import { toast, Toaster } from 'react-hot-toast';

export default function ApiLandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState<{silver: boolean, gold: boolean}>({ silver: false, gold: false });
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionStatusDetails | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const silverMonthly = 2;
  const goldMonthly = 10;
  const silverAnnual = silverMonthly * 12 * 0.8;
  const goldAnnual = goldMonthly * 12 * 0.8;

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionInfo();
    } else {
      setSubscriptionDetails(null);
    }
  }, [session]);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoadingSubscription(true);
      const response = await fetch('/api/user-subscription');
      
      if (response.ok) {
        const data = await response.json();
        
        const rawSubData: UserSubscriptionData = {
          subscriptionStatus: data.subscriptionStatus,
          currentPeriodEndsAt: data.currentPeriodEndsAt ? new Date(data.currentPeriodEndsAt) : null,
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
        };
        
        const details = getUserSubscriptionStatusDetails(rawSubData, data.subscriptionPlan, !!session);
        setSubscriptionDetails(details);
      } else {
        setSubscriptionDetails(getUserSubscriptionStatusDetails(null, null, !!session));
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      setSubscriptionDetails(getUserSubscriptionStatusDetails(null, null, !!session));
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleStartFreeTrial = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/api-landing`);
      return;
    }

    setIsStartingTrial(true);
    try {
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Free trial started successfully!');
        await fetchSubscriptionInfo();
      } else {
        throw new Error(data.error || 'Failed to start trial');
      }
    } catch (error) {
      console.error("Error starting free trial:", error);
      toast.error(`Failed to start trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleSubscribe = async (plan: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/api-landing`);
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: true }));
      const response = await fetch(`/api/stripe/checkout?plan=${plan.toLowerCase()}&billing=${isAnnual ? "annual" : "monthly"}`);
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: false }));
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: false }));
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getSubscriptionBadge = () => {
    if (!subscriptionDetails) return null;
    
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Toaster position="bottom-center" />
      {/* New wrapper to constrain all content like the main page */}
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-16">
        {/* Revised Hero Section - Two Column Layout */}
        <section className="relative py-12 md:py-20 bg-linear-to-r from-primary to-secondary text-white rounded-xl shadow-lg overflow-hidden">
          {/* Coming Soon Ribbon - Adjusted for Mobile */}
          <div className="absolute top-0 right-0 w-28 h-28 md:w-40 md:h-40 pointer-events-none">
            <div className="absolute transform rotate-45 bg-white text-primary font-semibold text-center py-1 right-[-30px] top-[22px] w-[130px] md:right-[-34px] md:top-[32px] md:w-[170px] shadow-md text-xs md:text-sm">
              Coming Soon
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 px-6 md:px-10">
            {/* Left Column: Text Content */}
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-5 md:mb-6 leading-tight">
                Smarter Transaction Categorization & Enrichment
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8">
                Coming Soon: Clean merchant names. Personalized categorization. Country-specific context.
                <br />
                All via a lightweight API designed for modern finance apps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={handleStartFreeTrial}
                  disabled={isStartingTrial || isLoadingSubscription || (subscriptionDetails?.hasAnyActiveAccess && !subscriptionDetails?.canStartNewTrial)}
                  className="inline-block bg-white text-primary font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg text-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingSubscription ? 'Loading...' : 
                   isStartingTrial ? 'Starting Trial...' : 
                   (subscriptionDetails?.hasAnyActiveAccess && !subscriptionDetails?.canStartNewTrial) ? 'Trial Active/Used' :
                   'Start Free Trial'}
                </button>
                <Link
                  href="/api-docs"
                  className="inline-block bg-secondary hover:bg-secondary-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 text-lg text-center"
                >
                  View API Docs
                </Link>
              </div>
            </div>

            {/* Right Column: Feature Points */}
            <div className="md:w-1/2 space-y-6">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🧽</span> Clean Merchant Names
                </h3>
                <p className="text-blue-50 text-sm">
                  Strip noise and normalize messy transaction strings like "*PAYPAL *NETFLIX-1234."
                </p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🔍</span> Personalized Categorization
                </h3>
                <p className="text-blue-50 text-sm">
                  Use a user's own past behavior to create a custom categorization model—no need for rigid rules.
                </p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🌍</span> Localized Intelligence
                </h3>
                <p className="text-blue-50 text-sm">
                  Understand and categorize based on region-specific spending patterns.
                </p>
              </div>
              {/* Placeholder for future graphic if desired */}
              {/* <div className="mt-6 text-center text-blue-200 text-sm">[Space for a relevant graphic or illustration]</div> */}
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="py-12 md:py-16 bg-gray-50 mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Minimal Setup, Maximum Clarity
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Send Transactions</h3>
                <p className="text-gray-600">
                  POST your raw transaction data to our API.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Optional Training (per user)</h3>
                <p className="text-gray-600">
                  Train a personalized model on each user's historical data for higher accuracy.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Receive Enriched Results</h3>
                <p className="text-gray-600">
                  Get back cleaned merchant names, suggested categories, and confidence scores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases section */}
        <section className="py-12 md:py-16 bg-white mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Designed for Finance Tools, Spreadsheet Add-ons, and Emerging Fintech
            </h2>
            <div className="max-w-3xl mx-auto">
              <ul className="space-y-6">
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Personal Finance Apps</h3>
                  <p className="text-gray-700">
                    Provide smarter automation without asking users to build rules.
                  </p>
                </li>
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Accounting Software</h3>
                  <p className="text-gray-700">
                    Enrich raw transactions for better reconciliation.
                  </p>
                </li>
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Spreadsheets & Add-ons</h3>
                  <p className="text-gray-700">
                    Add a layer of AI-powered clarity to Google Sheets or Excel workflows.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Section - Adapted from pricing/page.tsx */}
        <section className="py-12 md:py-16 bg-gray-50 mt-12 md:mt-16 rounded-xl shadow-lg" id="pricing">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                API Access Pricing
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Choose a plan to access the API. All plans include a 14-day free trial of Gold features.
              </p>

              {session && subscriptionDetails?.hasAnyActiveAccess && (
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
              {/* Silver Plan Card */}
              <div className={`bg-white rounded-2xl shadow-soft p-8 ${isPlanCurrentlyActive('SILVER') ? 'border-2 border-blue-400' : 'border border-gray-100'} flex flex-col`}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Silver API</h3>
                    <p className="text-gray-600 mt-2">For moderate API usage</p>
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
                
                <ul className="space-y-3 mb-8 grow">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">300 API calls per month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Merchant name cleaning</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Basic categorization</span>
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
                  <button onClick={() => handleSubscribe('silver')} disabled={isLoading.silver || isLoadingSubscription} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70">
                    {isLoading.silver || isLoadingSubscription ? 'Processing...' : 'Subscribe to Silver'}
                  </button>
                )}
              </div>
              
              {/* Gold Plan Card */}
              <div className={`bg-white rounded-2xl shadow-soft p-8 ${isPlanCurrentlyActive('GOLD') ? 'border-2 border-yellow-400' : 'border-2 border-primary/20'} flex flex-col relative overflow-hidden`}>
                <div className="absolute top-3 right-2 translate-x-[30%] translate-y-[-10%] rotate-45">
                  <div className="bg-primary text-white text-xs px-8 py-1 shadow-md">
                    Popular
                  </div>
                </div>
                
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Gold API</h3>
                    <p className="text-gray-600 mt-2">For extensive API usage</p>
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
                
                <ul className="space-y-3 mb-8 grow">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700"><strong>Unlimited</strong> API calls</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Merchant name cleaning</span>
                  </li>
                   <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Personalized categorization (user-trained models)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Localized intelligence</span>
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
                    <span className="text-gray-700">Early access to new API features</span>
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
                    {isStartingTrial ? 'Starting Trial...' : "Start 14-Day Free Trial (Gold Features)"}
                  </button>
                ) : (
                  <button onClick={() => handleSubscribe('gold')} disabled={isLoading.gold} className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70">
                    {isLoading.gold ? 'Processing...' : 'Subscribe to Gold'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Centered Free Trial Button below cards - if not logged in or can start trial */}
            {/* Show this button if user is NOT logged in OR if logged in AND can start a new trial AND is not currently on Gold trial from hero button */}
            {(!session || (subscriptionDetails && subscriptionDetails.canStartNewTrial)) && (
              <div className="mt-12 text-center">
                <button 
                  onClick={handleStartFreeTrial} 
                  disabled={isStartingTrial || isLoadingSubscription} 
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg disabled:opacity-70"
                >
                  {isLoadingSubscription ? 'Loading...' : isStartingTrial ? 'Starting Trial...' : "Start 14-Day Free Trial (Gold Features)"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-20 bg-primary text-white mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Let's Talk</h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Looking to integrate categorization into your product? Or just want to explore what's possible?
              Send us a message and we'll get back to you personally.
            </p>
            <Link
              href="mailto:f.strauf@gmail.com"
              className="bg-white text-primary font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
} 