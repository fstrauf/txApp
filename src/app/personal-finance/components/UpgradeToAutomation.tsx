'use client';

import React, { useState } from 'react';
import { 
  ArrowRightIcon, 
  SparklesIcon, 
  CheckIcon,
  ClockIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';

interface UpgradeToAutomationProps {
  isPaidSnapshot?: boolean;
  hasSubscription?: boolean;
  className?: string;
}

export const UpgradeToAutomation: React.FC<UpgradeToAutomationProps> = ({
  isPaidSnapshot = false,
  hasSubscription = false,
  className = ""
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for paid snapshot users who don't have a subscription
  if (!isPaidSnapshot || hasSubscription) return null;

  const handleUpgrade = async () => {
    posthog.capture('financial_snapshot_to_subscription_viewed', {
      source: 'dashboard_upsell',
      user_authenticated: !!session?.user?.id
    });

    setIsLoading(true);

    try {
      // Redirect to pricing page with special context
      router.push('/pricing?source=snapshot&trial=true');
      
      posthog.capture('financial_snapshot_to_subscription_clicked', {
        user_authenticated: !!session?.user?.id
      });
    } catch (error) {
      console.error('Error navigating to pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <CheckIcon className="h-5 w-5 text-green-600" />,
      text: "Automatic monthly updates"
    },
    {
      icon: <ClockIcon className="h-5 w-5 text-green-600" />,
      text: "Real-time runway tracking"
    },
    {
      icon: <BellIcon className="h-5 w-5 text-green-600" />,
      text: "Spending alerts & insights"
    },
    {
      icon: <ChartBarIcon className="h-5 w-5 text-green-600" />,
      text: "Advanced financial analytics"
    }
  ];

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-lg font-semibold text-purple-600">Upgrade to Automation</span>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Love your snapshot? Keep it <span className="text-purple-600">updated automatically</span>
        </h3>
        
        <p className="text-gray-600 text-lg mb-4">
          Your snapshot will get stale next month. Upgrade to automatic tracking:
        </p>
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {feature.icon}
            </div>
            <span className="text-gray-700 font-medium">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Value Proposition */}
      <div className="bg-white/80 rounded-lg p-4 mb-6 border border-purple-100">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Starting at</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">$2/month</p>
          <p className="text-sm text-purple-600 font-medium">✓ 14-day free trial</p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Loading...
          </>
        ) : (
          <>
            Start Free Trial
            <ArrowRightIcon className="h-5 w-5" />
          </>
        )}
      </button>

      {/* Trust signals */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-1">
          🚀 Cancel anytime • 💝 No long-term commitment
        </p>
        <p className="text-xs text-gray-400">
          Join 1,000+ users already tracking their financial freedom
        </p>
      </div>
    </div>
  );
};
