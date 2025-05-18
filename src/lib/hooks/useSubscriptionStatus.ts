


'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserSubscriptionStatusDetails, type SubscriptionStatusDetails, type UserSubscriptionData } from '@/lib/authUtils';
import { useSession } from 'next-auth/react';

// The raw data structure expected from the /api/user-subscription endpoint
interface RawSubscriptionDataFromAPI {
  subscriptionStatus: string | null;
  currentPeriodEndsAt: string | null; // Dates are strings from API
  trialEndsAt: string | null;       // Dates are strings from API
  subscriptionPlan?: string | null;
}

// Define the expected subscription status values if known, otherwise keep as string
// Assuming UserSubscriptionData in authUtils.ts has a more specific type for subscriptionStatus
type ExpectedSubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | null;

// Assuming UserSubscriptionData in authUtils.ts should accommodate subscriptionPlan
// If not, authUtils.ts needs to be updated. For now, this makes the hook consistent.
interface ExtendedUserSubscriptionData extends UserSubscriptionData {
    subscriptionPlan?: string | null;
    subscriptionStatus: ExpectedSubscriptionStatus; // Use the more specific type
}

const fetchUserSubscription = async (): Promise<RawSubscriptionDataFromAPI> => {
  const response = await fetch('/api/user-subscription');
  if (!response.ok) {
    try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch subscription status: ${response.statusText}`);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Failed to fetch subscription status: ${response.statusText}. ${errorMessage}`);
    }
  }
  return response.json();
};

export const useSubscriptionStatus = () => {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated' && !!session;

  const { 
    data: rawData, 
    isLoading: isLoadingRawData, 
    error: rawDataError,
    refetch, 
    isError: isRawDataError,
  } = useQuery<RawSubscriptionDataFromAPI, Error, RawSubscriptionDataFromAPI, ['userSubscriptionStatus']>({
    queryKey: ['userSubscriptionStatus'],
    queryFn: fetchUserSubscription,
    enabled: isAuthenticated, 
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, // Changed cacheTime to gcTime
  });

  const subscriptionDetails: SubscriptionStatusDetails | null = React.useMemo(() => {
    if (!isAuthenticated || !rawData) { // Ensure user is authenticated and rawData exists
        return getUserSubscriptionStatusDetails(null, null, isAuthenticated);
    }
    
    const parsedUserSubscriptionData: ExtendedUserSubscriptionData = {
      // Assert the type for subscriptionStatus from the raw API data
      subscriptionStatus: rawData.subscriptionStatus as ExpectedSubscriptionStatus,
      currentPeriodEndsAt: rawData.currentPeriodEndsAt ? new Date(rawData.currentPeriodEndsAt) : null,
      trialEndsAt: rawData.trialEndsAt ? new Date(rawData.trialEndsAt) : null,
      subscriptionPlan: rawData.subscriptionPlan,
    };
    // Ensure subscriptionPlan is passed as string | null
    return getUserSubscriptionStatusDetails(parsedUserSubscriptionData, rawData.subscriptionPlan ?? null, isAuthenticated);
  }, [rawData, isAuthenticated]);
  
  const isLoading = sessionStatus === 'loading' || (isAuthenticated && isLoadingRawData);
  const isError = isRawDataError;
  const error = rawDataError;

  return {
    subscriptionDetails,
    rawData,
    isLoading,
    isError,
    error,
    refetchSubscriptionStatus: refetch,
  };
}; 