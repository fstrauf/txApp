'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasActiveSubscriptionOrTrial, type UserSubscriptionData } from '@/lib/authUtils';

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

  const generateApiKey = async () => {
    try {
      const newApiKey = crypto.randomUUID();
      
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId,
          api_key: newApiKey
        }),
      });

      if (!response.ok) throw new Error('Failed to generate API key');
      
      toast.success('API key generated successfully');
      queryClient.invalidateQueries({ queryKey: ['accountInfo', userId] });
      onSuccess?.();
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
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
        toast.success('Free trial started successfully!');
        queryClient.invalidateQueries({ queryKey: ['accountInfo', userId] });
        onSuccess?.();
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
    
    switch (accountInfo.subscriptionPlan) {
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
    
    const plan = accountInfo.subscriptionPlan || 'FREE';
    const status = accountInfo.subscriptionStatus || '';
    
    console.log('Subscription Badge - Plan:', plan, 'Status:', status);
    
    let badgeColor = 'bg-gray-100 text-gray-800';
    
    if (plan === 'SILVER') {
      badgeColor = 'bg-blue-100 text-blue-800';
    } else if (plan === 'GOLD') {
      badgeColor = 'bg-yellow-100 text-yellow-800';
    }
    
    if (status === 'TRIALING') {
      badgeColor = 'bg-purple-100 text-purple-800';
    } else if (status === 'PAST_DUE') {
      badgeColor = 'bg-red-100 text-red-800';
    }
    
    if (plan === 'FREE' && !status) {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
          Free Plan
        </span>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {plan}{status === 'TRIALING' ? ' (Trial)' : ''}
      </span>
    );
  };

  const isActiveOrTrial = hasActiveSubscriptionOrTrial(accountInfo);

  if (isLoadingAccount) {
    return <div className="text-gray-700 text-center">Loading Account Info...</div>;
  }

  if (accountError) {
    return <div className="text-red-500 text-center">Error loading account info: {accountError.message}</div>;
  }

  if (!accountInfo) {
     return <div className="text-gray-700 text-center">No account information available.</div>;
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
        
        {!isActiveOrTrial ? (
          <div className="mb-4">
            <p className="text-gray-700 mb-4">Access to the API key requires an active subscription. Start a free trial to get full access.</p>
            <button 
              onClick={startFreeTrial}
              disabled={startingTrial}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200 disabled:opacity-70"
            >
              {startingTrial ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Start Free Trial"
              )}
            </button>
            <Link 
              href="/pricing" 
              className="ml-4 text-primary hover:underline font-medium"
            >
              View Plans
            </Link>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-700">
              <span className="font-medium">Plan:</span> {accountInfo?.subscriptionPlan}{' '}
              ({accountInfo?.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'})
            </p>
            {accountInfo?.trialEndsAt && accountInfo.trialEndsAt.getTime() > Date.now() && (
              <p className="text-gray-700">
                <span className="font-medium">Trial ends:</span> {formatDate(accountInfo.trialEndsAt.toISOString())}
              </p>
            )}
            {accountInfo?.subscriptionStatus === 'ACTIVE' && accountInfo?.currentPeriodEndsAt && (
              <p className="text-gray-700">
                <span className="font-medium">Next billing date:</span> {formatDate(accountInfo.currentPeriodEndsAt.toISOString())}
              </p>
            )}
            <div className="mt-4">
              <Link
                href="/pricing"
                className="text-primary hover:underline font-medium"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {usageInfo && (
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
                `${usageInfo.remaining} categorizations remaining this month` : 
                'Unlimited categorizations included in your plan'}
            </p>
          </div>
        )}
      </div>
      
      {isActiveOrTrial && (
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
      )}
    </div>
  );
} 