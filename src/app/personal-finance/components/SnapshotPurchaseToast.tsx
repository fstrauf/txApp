"use client";
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SnapshotPurchaseToastProps {
  userToastStatus?: string | null;
  onStatusUpdate?: (status: string) => void;
  onClose?: () => void;
}

const SnapshotPurchaseToast: React.FC<SnapshotPurchaseToastProps> = ({ 
  userToastStatus,
  onStatusUpdate,
  onClose
}) => {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Determine if this status should show a toast
  // Note: 'auth_needed_for_snapshot' is now handled by OnboardingModal
  const relevantStatuses = [
    'payment_verification_failed',
    'payment_not_completed',
    'email_mismatch',
    'snapshot_ready',
    'snapshot_error'
  ];

  const shouldShowToast = userToastStatus && relevantStatuses.includes(userToastStatus);

  // Effect 1: Control visibility
  useEffect(() => {
    if (shouldShowToast) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [shouldShowToast]);

  // Effect 2: Auto-close for success messages - ALWAYS called
  useEffect(() => {
    if (visible && userToastStatus === 'snapshot_ready') {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, userToastStatus]);

  const handleClose = () => {
    setVisible(false);
    if (onStatusUpdate) {
      onStatusUpdate('');
    }
    if (onClose) {
      onClose();
    }
  };

  const handleSignIn = () => {
    const currentUrl = window.location.href;
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
  };

  const handleSignUp = () => {
    const currentUrl = window.location.href;
    router.push(`/auth/signup?callbackUrl=${encodeURIComponent(currentUrl)}`);
  };

  // If not visible or no relevant status, return null AFTER all hooks
  if (!visible || !shouldShowToast) {
    return null;
  }

  const getToastConfig = () => {
    switch (userToastStatus) {
      case 'snapshot_ready':
        return {
          type: 'success' as const,
          icon: <CheckCircleIcon className="h-5 w-5" />,
          title: 'Financial Snapshot Ready!',
          message: 'Your payment has been verified. Upload your transactions to get started.',
        };

      case 'payment_verification_failed':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          title: 'Payment Verification Failed',
          message: 'We couldn\'t verify your payment. Please contact support if this persists.',
        };

      case 'payment_not_completed':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          title: 'Payment Not Completed',
          message: 'Your payment was not successful. Please try purchasing again.',
        };

      case 'email_mismatch':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          title: 'Email Mismatch',
          message: 'Your Financial Snapshot was purchased with a different email. You can still use the app normally, but to access your paid snapshot, please sign in with the email used for payment or contact support.',
        };

      case 'snapshot_error':
        return {
          type: 'error' as const,
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          title: 'Error Processing Snapshot',
          message: 'There was an error setting up your Financial Snapshot. Please contact support.',
        };

      default:
        return {
          type: 'info' as const,
          icon: <ExclamationCircleIcon className="h-5 w-5" />,
          title: 'Unknown Status',
          message: 'Something happened with your Financial Snapshot.',
        };
    }
  };

  const toastConfig = getToastConfig();

  const getToastColors = () => {
    switch (toastConfig.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColors = () => {
    switch (toastConfig.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`rounded-lg border p-4 shadow-lg ${getToastColors()}`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColors()}`}>
            {toastConfig.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {toastConfig.title}
            </h3>
            <p className="text-sm mt-1 opacity-90">
              {toastConfig.message}
            </p>
            {(toastConfig as any).actions}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotPurchaseToast; 