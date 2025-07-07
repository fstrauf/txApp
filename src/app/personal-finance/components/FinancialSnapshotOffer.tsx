'use client';

import React, { useState } from 'react';
import { ArrowRightIcon, ChartBarIcon, SparklesIcon, ClockIcon, CurrencyDollarIcon, CheckIcon } from '@heroicons/react/24/outline';
import posthog from 'posthog-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FinancialSnapshotOfferProps {
  onPurchaseClick?: () => void;
  className?: string;
}

export const FinancialSnapshotOffer: React.FC<FinancialSnapshotOfferProps> = ({
  onPurchaseClick,
  className = ""
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    // Track offer interaction
    posthog.capture('financial_snapshot_viewed', { 
      source: 'emergency_calculator',
      user_authenticated: !!session?.user?.id 
    });

    setIsLoading(true);

    try {
      if (onPurchaseClick) {
        onPurchaseClick();
      } else {
        // Create Stripe checkout for $49 Financial Snapshot (no auth required)
        const response = await fetch('/api/stripe/checkout?plan=snapshot&billing=one-time&redirect=/personal-finance');
        
        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }
        
        const { url } = await response.json();
        
        if (url) {
          posthog.capture('financial_snapshot_purchase_initiated', { 
            amount: 49,
            user_authenticated: !!session?.user?.id 
          });
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      // Fallback: redirect to personal finance with offer parameter
      router.push('/personal-finance?offer=snapshot');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: <ChartBarIcon className="h-5 w-5 text-green-600" />,
      text: "Your exact financial runway (not estimates)"
    },
    {
      icon: <CurrencyDollarIcon className="h-5 w-5 text-green-600" />,
      text: "Where your money actually goes"
    },
    {
      icon: <SparklesIcon className="h-5 w-5 text-green-600" />,
      text: "Hidden spending patterns revealed"
    },
    {
      icon: <ClockIcon className="h-5 w-5 text-green-600" />,
      text: "Your personalized savings opportunities"
    }
  ];

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-lg font-semibold text-blue-600">Financial Snapshot</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          See Your Complete Financial Picture in <span className="text-blue-600">2 Minutes</span>
        </h2>
        
        <p className="text-gray-600 text-lg mb-4">
          Upload up to 24 months of transactions and instantly see:
        </p>
      </div>

      {/* Benefits List */}
      <div className="space-y-3 mb-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {benefit.icon}
            </div>
            <span className="text-gray-700 font-medium">{benefit.text}</span>
          </div>
        ))}
      </div>

      {/* Value Proposition */}
      <div className="bg-white/80 rounded-lg p-4 mb-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">One-time payment</p>
            <p className="text-3xl font-bold text-gray-900">$49</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-medium">✓ Instant results</p>
            <p className="text-sm text-green-600 font-medium">✓ No subscription</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            Get My Financial Snapshot - $49
            <ArrowRightIcon className="h-6 w-6" />
          </>
        )}
      </button>

      {/* Trust signals */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-1">
          🔒 Secure payment • 💰 30-day money-back guarantee
        </p>
        <p className="text-xs text-gray-400">
          Your data is processed securely and never shared
        </p>
      </div>
    </div>
  );
};
