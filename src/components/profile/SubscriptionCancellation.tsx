'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button'; // Correct import path

interface SubscriptionCancellationProps {
  // Pass any necessary props, e.g., if you need to update parent state on success
  onSubscriptionCancelled?: () => void;
  // Add prop to know if cancellation is already pending
  isCancellationPending: boolean;
  // Add prop for current period end date if cancellation is pending
  currentPeriodEnd: string | null;
}

export function SubscriptionCancellation({ 
  onSubscriptionCancelled, 
  isCancellationPending, 
  currentPeriodEnd 
}: SubscriptionCancellationProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Cancelling subscription...');

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          // Assuming JWT is stored in localStorage or handled by auth context
          // Adjust header fetching as needed based on your auth implementation
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast.success(data.message || 'Subscription set to cancel at period end.', { id: toastId });
      if (onSubscriptionCancelled) {
        onSubscriptionCancelled(); // Notify parent component if needed
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Cancellation error:', error);
      toast.error(`Cancellation failed: ${errorMessage}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (isCancellationPending) {
    return (
      <div className="mt-4 p-4 border rounded-md bg-yellow-50 border-yellow-200 text-yellow-800">
        <p className="font-medium">Subscription Cancellation Pending</p>
        <p>Your subscription is set to cancel at the end of the current billing period on {formatDate(currentPeriodEnd)}. You will retain access until then.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-gray-600">
        If you cancel, your subscription will remain active until the end of the current billing period.
      </p>
      <Button
        onClick={handleCancelSubscription}
        disabled={isLoading}
        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      >
        {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
      </Button>
    </div>
  );
} 