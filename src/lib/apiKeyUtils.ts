import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getUserSubscriptionStatusDetails } from '@/lib/authUtils';

/**
 * Generates a new API key for the given user and updates the account.
 * Invalidates the accountInfo query on success.
 * 
 * @param userId The ID of the user.
 * @param queryClient The React Query client instance.
 * @param onSuccess Optional callback to run on successful generation.
 */
export const generateApiKeyUtil = async (
  userId: string, 
  queryClient: QueryClient, 
  onSuccess?: () => void
): Promise<void> => {
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

    if (!response.ok) throw new Error('Failed to generate API key via util');
    
    // Don't show toast here - let the caller handle the messaging
    queryClient.invalidateQueries({ queryKey: ['accountInfo', userId] });
    onSuccess?.(); // Call the original onSuccess if provided
  } catch (error) {
    console.error('Error generating API key via util:', error);
    // Re-throw the error so the caller can handle it if needed
    // Or display a more specific toast message here if preferred
    throw error; // Re-throwing allows startFreeTrial to catch it
  }
};

/**
 * Ensures user has both active trial/subscription and API key for training functionality.
 * If not, automatically starts trial and generates API key.
 * Returns true if ready for training, false if user needs to upgrade manually.
 * 
 * @param userId The ID of the user
 * @param queryClient Optional React Query client instance for cache invalidation
 * @param showToast Whether to show user-facing toast messages (default: true)
 */
export const ensureApiAccessForTraining = async (
  userId: string,
  queryClient?: QueryClient,
  showToast: boolean = true
): Promise<{ success: boolean; message: string; needsSubscription?: boolean }> => {
  try {
    console.log(`[ensureApiAccess] Checking API access for user: ${userId}`);

    // Step 1: Check current subscription status
    const subscriptionResponse = await fetch('/api/user-subscription');
    if (!subscriptionResponse.ok) {
      throw new Error('Failed to check subscription status');
    }
    
    const rawSubscriptionData = await subscriptionResponse.json();
    console.log(`[ensureApiAccess] Raw subscription data:`, rawSubscriptionData);
    
    // Use the proper utility to determine subscription status
    const subscriptionDetails = getUserSubscriptionStatusDetails(
      rawSubscriptionData,
      rawSubscriptionData.subscriptionPlan,
      true // hasSession = true (user is logged in)
    );
    
    console.log(`[ensureApiAccess] Subscription details:`, {
      hasAnyActiveAccess: subscriptionDetails.hasAnyActiveAccess,
      canStartNewTrial: subscriptionDetails.canStartNewTrial,
      isActiveTrial: subscriptionDetails.isActiveTrial,
      isActivePaidPlan: subscriptionDetails.isActivePaidPlan,
      hasExpiredTrial: subscriptionDetails.hasExpiredTrial
    });

    // Step 2: If no active access, try to start trial automatically
    if (!subscriptionDetails.hasAnyActiveAccess) {
      if (subscriptionDetails.canStartNewTrial) {
        if (showToast) {
          toast.loading('🎉 Starting your free 14-day trial to unlock AI training...', { id: 'trial-setup' });
        }
        
        console.log(`[ensureApiAccess] Starting free trial for user: ${userId}`);
        const trialResponse = await fetch('/api/user/start-trial', {
          method: 'POST',
        });

        if (!trialResponse.ok) {
          const trialError = await trialResponse.json();
          throw new Error(trialError.error || 'Failed to start trial');
        }

        if (showToast) {
          toast.success('✅ Free trial activated! You now have access to AI training.', { id: 'trial-setup' });
        }
        console.log(`[ensureApiAccess] Trial started successfully for user: ${userId}`);
      } else {
        // User has expired trial or already used trial - needs to subscribe
        console.log(`[ensureApiAccess] User cannot start trial, needs subscription`);
        return {
          success: false,
          message: 'AI training requires an active subscription. Your trial has expired.',
          needsSubscription: true
        };
      }
    }

    // Step 3: Check if user has API key
    const accountResponse = await fetch(`/api/account/beta-status`);
    if (!accountResponse.ok) {
      throw new Error('Failed to check account status');
    }
    
    const accountData = await accountResponse.json();
    console.log(`[ensureApiAccess] Account data:`, accountData);

    // Step 4: Generate API key if missing
    if (!accountData.api_key) {
      if (showToast) {
        toast.loading('🔑 Generating your personal AI training key...', { id: 'api-key-setup' });
      }
      
      console.log(`[ensureApiAccess] Generating API key for user: ${userId}`);
      
      if (queryClient) {
        await generateApiKeyUtil(userId, queryClient);
      } else {
        // Fallback without query client
        const newApiKey = crypto.randomUUID();
        const apiResponse = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: userId,
            api_key: newApiKey
          }),
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to generate API key');
        }
      }

      if (showToast) {
        toast.success('🎯 Ready! Your personal AI trainer is set up.', { id: 'api-key-setup' });
      }
      console.log(`[ensureApiAccess] API key generated successfully for user: ${userId}`);
    }

    // Step 5: Success - user is ready for training
    console.log(`[ensureApiAccess] User ${userId} is ready for training`);
    return {
      success: true,
      message: 'Ready for AI training'
    };

  } catch (error) {
    console.error(`[ensureApiAccess] Error setting up API access for user ${userId}:`, error);
    
    if (showToast) {
      toast.error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        id: 'api-setup-error' 
      });
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to setup API access'
    };
  }
}; 