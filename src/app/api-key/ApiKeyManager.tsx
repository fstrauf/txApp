'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserSubscriptionData } from '@/lib/authUtils';
import { generateApiKeyUtil } from '@/lib/apiKeyUtils';

// Account interface matching UserSubscriptionData + specific fields
interface Account extends UserSubscriptionData {
  id: string;
  api_key: string | null;
  email: string | null;
  name: string | null;
  subscriptionPlan: string;
  subscriptionStatus: UserSubscriptionData['subscriptionStatus'];
  billingCycle: string | null;
  currentPeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
  monthlyCategorizations: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface ApiKeyManagerProps {
  userId: string;
  onSuccess?: () => void;
}

// Define fetch function for account info
const fetchAccountInfo = async (userId: string): Promise<Account> => {
  const response = await fetch(`/api/account?userId=${userId}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch account info');
  }
  const data = await response.json();
   // Ensure dates are Date objects
   const accountData = {
    ...data,
    currentPeriodEndsAt: data.currentPeriodEndsAt ? new Date(data.currentPeriodEndsAt) : null,
    trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
  };
  console.log('Fetched Account info data via React Query:', accountData);
  return accountData as Account;
};

export default function ApiKeyManager({ userId, onSuccess }: ApiKeyManagerProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Use useQuery for account info
  const { 
    data: accountInfo, 
    isLoading: isLoadingAccount,
    error: accountError,
  } = useQuery<Account, Error>({ 
    queryKey: ['accountInfo', userId],
    queryFn: () => fetchAccountInfo(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });

  const [startingTrial, setStartingTrial] = useState(false);

  // Derive API key from query data
  const apiKey = useMemo(() => accountInfo?.api_key || null, [accountInfo]);

  // --- Granular Status Checks --- 
  const now = Date.now();
  const isActiveSub = !!accountInfo && accountInfo.subscriptionStatus === 'ACTIVE';
  const isActiveTrial = !!accountInfo && !!accountInfo.trialEndsAt && accountInfo.trialEndsAt.getTime() > now;
  const hasExpiredTrial = !!accountInfo && !!accountInfo.trialEndsAt && accountInfo.trialEndsAt.getTime() <= now;
  // Can start trial only if account info is loaded and user has no active/expired access
  const canStartTrial = accountInfo !== null && !isActiveSub && !isActiveTrial && !hasExpiredTrial; 
  const hasAnyActiveAccess = isActiveSub || isActiveTrial;
  // --- End Status Checks ---

  // Refactor generateApiKey to use the utility function
  const generateApiKey = async () => {
    try {
      await generateApiKeyUtil(userId, queryClient, onSuccess);
      // Success toast is handled within the util
    } catch (error) {
      // Error is logged in util, display toast here
      toast.error(`Failed to generate API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const copyToClipboard = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const startFreeTrial = async () => {
    setStartingTrial(true);
    try {
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Free trial started successfully!'); // Toast for trial success
        queryClient.invalidateQueries({ queryKey: ['accountInfo', userId] });
        // Also invalidate the general subscription status for other components
        queryClient.invalidateQueries({ queryKey: ['userSubscriptionStatus'] }); 
        
        // --- New: Automatically generate API key after starting trial --- 
        try {
          await generateApiKeyUtil(userId, queryClient); 
          // Assuming generateApiKeyUtil handles its own success toast for API key generation.
          // No additional combined toast here to prevent doubling if generateApiKeyUtil toasts.
        } catch (apiKeyError) {
          // Log error from util, show specific toast
          toast.error(`Trial started, but API key generation failed: ${apiKeyError instanceof Error ? apiKeyError.message : 'Please generate manually'}`);
        }
        // --- End New --- 
        onSuccess?.(); // Call original onSuccess after everything
      } else {
        throw new Error(data.error || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Error starting free trial:', error);
      toast.error(`Failed to start trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setStartingTrial(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date string:', dateString, e);
      return 'Invalid Date';
    }
  };

  const getUsageInfo = () => {
    if (!accountInfo) return null;
    
    // If subscription is canceled, treat as FREE regardless of plan
    const effectivePlan = (accountInfo.subscriptionStatus === 'CANCELED') ? 'FREE' : accountInfo.subscriptionPlan;
    
    switch (effectivePlan) {
      case 'SILVER':
        return {
          limit: 20,
          used: accountInfo.monthlyCategorizations || 0,
          remaining: Math.max(0, 20 - (accountInfo.monthlyCategorizations || 0))
        };
      case 'GOLD':
        return {
          limit: 'Unlimited',
          used: accountInfo.monthlyCategorizations || 0,
          remaining: 'Unlimited'
        };
      default: // FREE
        return {
          limit: 5,
          used: accountInfo.monthlyCategorizations || 0,
          remaining: Math.max(0, 5 - (accountInfo.monthlyCategorizations || 0))
        };
    }
  };

  const getSubscriptionBadge = () => {
    if (!accountInfo) return null;
    
    // If subscription is canceled, treat as FREE regardless of plan
    const effectivePlan = (accountInfo.subscriptionStatus === 'CANCELED') ? 'FREE' : (accountInfo.subscriptionPlan || 'FREE');
    const status = accountInfo.subscriptionStatus || '';
    
    console.log('Subscription Badge - Plan:', effectivePlan, 'Status:', status, 'Original Plan:', accountInfo.subscriptionPlan);
    
    let badgeColor = 'bg-gray-100 text-gray-800';
    
    if (effectivePlan === 'SILVER') {
      badgeColor = 'bg-blue-100 text-blue-800';
    } else if (effectivePlan === 'GOLD') {
      badgeColor = 'bg-yellow-100 text-yellow-800';
    }
    
    if (status === 'ACTIVE' && accountInfo.trialEndsAt && new Date(accountInfo.trialEndsAt).getTime() > Date.now()) {
      badgeColor = 'bg-purple-100 text-purple-800';
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
          {effectivePlan} (Trial)
        </span>
      );
    }
    
    if (effectivePlan === 'FREE' && !status) {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
          Free Plan
        </span>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {effectivePlan}
      </span>
    );
  };

  if (isLoadingAccount) {
    return <div className="text-gray-700 text-center py-4">Loading Account Info...</div>;
  }

  if (accountError) {
    return <div className="text-red-500 text-center py-4">Error loading account info: {accountError.message}</div>;
  }

  if (!accountInfo) {
     return <div className="text-gray-700 text-center py-4">No account information available.</div>;
  }

  const usageInfo = getUsageInfo();

  return (
    <div className="space-y-8">
      <Toaster position="bottom-center" />
      
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
          {getSubscriptionBadge()}
        </div>
        
        {isActiveSub && (
          <p className="text-gray-700">
            <span className="font-medium">Plan:</span> {accountInfo.subscriptionPlan}{' '}
            ({accountInfo.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'})
          </p>
        )}
        {isActiveTrial && (
          <p className="text-gray-700">
            <span className="font-medium">Trial ends:</span> {formatDate(accountInfo.trialEndsAt?.toISOString() ?? null)}
          </p>
        )}
        {isActiveSub && accountInfo.currentPeriodEndsAt && (
          <p className="text-gray-700">
            <span className="font-medium">Next billing date:</span> {formatDate(accountInfo.currentPeriodEndsAt?.toISOString() ?? null)}
          </p>
        )}
        {hasExpiredTrial && (
          <p className="text-gray-700 text-yellow-700 font-medium">Your free trial has expired.</p>
        )}
        {canStartTrial && (
          <p className="text-gray-700">You are currently on the Free plan.</p>
        )}

        <div className="mt-4">
          {hasAnyActiveAccess ? (
            <Link href="/pricing" className="text-primary hover:underline font-medium">
              Manage Subscription
            </Link>
          ) : hasExpiredTrial ? (
            <Link href="/pricing" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200">
              View Plans & Subscribe
            </Link>
          ) : canStartTrial ? (
            <button 
              onClick={startFreeTrial}
              disabled={startingTrial}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200 disabled:opacity-70"
            >
              {startingTrial ? 'Processing...' : "Start Free Trial"}
            </button>
          ) : null}
        </div>

        {usageInfo && hasAnyActiveAccess && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">Monthly Categorization Usage</h3>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Used: {usageInfo.used}</span>
              <span>Limit: {usageInfo.limit}</span>
            </div>
            
            {typeof usageInfo.limit === 'number' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (usageInfo.used / usageInfo.limit) * 100)}%` }}
                ></div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-2">
              {typeof usageInfo.remaining === 'number' ? 
                `${usageInfo.remaining} categorizations remaining` : 
                'Unlimited categorizations included'}
            </p>
          </div>
        )}
      </div>
      
      {hasAnyActiveAccess ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">API Key</h2>
          
          {apiKey ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl shadow-soft border border-gray-200">
                <p className="text-sm font-mono text-gray-700 break-all">{apiKey}</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
                >
                  Copy API Key
                </button>
                <button
                  onClick={generateApiKey}
                  className="px-6 py-3 rounded-xl bg-white text-primary border border-primary/10 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-soft"
                >
                  Generate New Key
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={generateApiKey}
                className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
              >
                Generate API Key
              </button>
            </div>
          )}
          
          <div className="bg-surface rounded-xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to use your API key:</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Copy your API key</li>
              <li>Open the template of your Google Sheet</li>
              <li>Go to Extensions &gt; Expense Sorted &gt; Configure API Key</li>
              <li>Add your API key to the configuration</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-6 text-center">
           <p className="font-medium">API Key access requires an active subscription or trial.</p>
            {!canStartTrial && hasExpiredTrial && (
               <Link href="/pricing" className="mt-2 inline-block underline font-semibold">View Plans & Subscribe</Link>
            )}
            {canStartTrial && (
                 <button 
                    onClick={startFreeTrial}
                    disabled={startingTrial}
                    className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200 disabled:opacity-70"
                  >
                     {startingTrial ? 'Processing...' : "Start Free Trial"}
                 </button>
            )}
        </div>
      )}
    </div>
  );
} 