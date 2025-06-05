import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface SubscriptionData {
  subscriptionPlan: string;
  subscriptionStatus: string | null;
  billingCycle: string | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  hasActiveSubscription: boolean;
}

interface StartTrialResponse {
  success: boolean;
  error?: string;
  trialEndsAt?: string;
}

interface CancelSubscriptionResponse {
  message: string;
  error?: string;
}

/**
 * Hook for managing subscription data and operations
 * Uses our new centralized SubscriptionService on the backend
 */
export function useSubscriptionManagement() {
  const queryClient = useQueryClient();

  // Fetch current subscription status
  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriptionData>({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      const response = await fetch('/api/user-subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Start trial mutation
  const startTrialMutation = useMutation<StartTrialResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/user/start-trial', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success('Trial started successfully!');
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
    },
    onError: (error) => {
      toast.error(`Failed to start trial: ${error.message}`);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation<CancelSubscriptionResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
    },
    onError: (error) => {
      toast.error(`Failed to cancel subscription: ${error.message}`);
    },
  });

  // Derive computed values
  const hasAccess = subscription?.hasActiveSubscription || false;
  const isOnTrial = subscription?.subscriptionStatus === 'TRIAL' && 
                   subscription?.trialEndsAt && 
                   new Date(subscription.trialEndsAt) > new Date();
  const isPaidPlan = subscription?.subscriptionStatus === 'ACTIVE' && 
                    subscription?.subscriptionPlan !== 'FREE';
  const canStartTrial = subscription?.subscriptionPlan === 'FREE' && 
                       !subscription?.trialEndsAt; // Never had a trial

  return {
    // Data
    subscription,
    isLoading,
    error,
    
    // Computed values
    hasAccess,
    isOnTrial,
    isPaidPlan,
    canStartTrial,
    
    // Actions
    startTrial: startTrialMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    refetch,
    
    // Loading states
    isStartingTrial: startTrialMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
  };
}

/**
 * Hook for subscription access control
 * Simple helper for checking if user has access to features
 */
export function useSubscriptionAccess() {
  const { hasAccess, isLoading } = useSubscriptionManagement();
  
  return {
    hasAccess,
    isLoading,
    requiresUpgrade: !hasAccess && !isLoading,
  };
}
