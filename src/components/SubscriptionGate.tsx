import React from 'react';
import Link from 'next/link';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionManagement';

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
}

/**
 * Component that gates features behind subscription access
 * Uses our centralized subscription management system
 */
export function SubscriptionGate({ 
  children, 
  fallback, 
  feature = 'feature' 
}: SubscriptionGateProps) {
  const { hasAccess, isLoading, requiresUpgrade } = useSubscriptionAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requiresUpgrade) {
    return fallback || (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <div className="mb-4">
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
            PRO
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unlock {feature}
        </h3>
        <p className="text-gray-600 mb-4">
          This {feature} requires an active subscription. Start your free trial or upgrade to continue.
        </p>
        <div className="space-x-3">
          <Link 
            href="/pricing"
            className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Start Free Trial
          </Link>
          <Link 
            href="/pricing"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Simple subscription status badge component
 */
export function SubscriptionBadge() {
  const { subscription } = useSubscriptionManagement();

  if (!subscription) return null;

  const { subscriptionPlan, subscriptionStatus } = subscription;
  
  let badgeColor = 'bg-gray-100 text-gray-800';
  let badgeText = subscriptionPlan || 'FREE';

  if (subscriptionPlan === 'GOLD') {
    badgeColor = 'bg-yellow-100 text-yellow-800';
  } else if (subscriptionPlan === 'SILVER') {
    badgeColor = 'bg-blue-100 text-blue-800';
  }

  if (subscriptionStatus === 'TRIAL') {
    badgeColor = 'bg-purple-100 text-purple-800';
    badgeText += ' (Trial)';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
      {badgeText}
    </span>
  );
}
