import React, { useState } from 'react';
import { Box } from '@/components/ui/Box';
import { BellIcon, ChartBarIcon, ArrowPathIcon, ChartPieIcon } from '@heroicons/react/24/outline';

interface ProFeatureTeaserProps {
  feature: 'spending-alerts' | 'progress-tracking' | 'auto-sync' | 'weekly-insights';
  context: string;
  currentValue?: string | number;
  potentialValue?: string | number;
}

export const ProFeatureTeaser: React.FC<ProFeatureTeaserProps> = ({
  feature,
  context,
  currentValue,
  potentialValue
}) => {
  const [showInterest, setShowInterest] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const features = {
    'spending-alerts': {
      icon: BellIcon,
      title: 'Real-time Spending Alerts',
      description: 'Get notified when you\'re approaching budget limits',
      example: 'You\'re 80% through your dining budget with 10 days left in the month'
    },
    'progress-tracking': {
      icon: ChartBarIcon,
      title: 'Track Your Progress',
      description: 'See how your finances improve over time',
      example: 'Your spending decreased by 12% this month!'
    },
    'auto-sync': {
      icon: ArrowPathIcon,
      title: 'Automatic Bank Sync',
      description: 'No more manual CSV uploads - everything syncs automatically',
      example: 'Last synced: 2 minutes ago'
    },
    'weekly-insights': {
      icon: ChartPieIcon,
      title: 'Weekly Smart Insights',
      description: 'Get personalized tips based on your spending patterns',
      example: 'You could save $47/month by switching your gym membership'
    }
  };

  const current = features[feature];

  // Safety check to prevent undefined access
  if (!current) {
    console.error(`ProFeatureTeaser: Invalid feature "${feature}". Valid features are:`, Object.keys(features));
    return null;
  }

  const handleNotifyMe = () => {
    // Track this interaction
    console.log('User interested in:', feature);
    setShowInterest(true);
    
    // In production, send this to your analytics/database
    if (typeof window !== 'undefined') {
      // Track with your analytics
      // window.gtag('event', 'pro_feature_interest', { feature });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!email) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/createEmailContact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          source: 'OTHER',
          tags: ['pro-features', `pro-feature-${feature}`, 'personal-finance']
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setShowInterest(false);
        
        // Track successful submission
        console.log('Pro feature interest captured:', { email, feature });
        
        // In production, track with analytics
        if (typeof window !== 'undefined') {
          // window.gtag('event', 'pro_feature_email_captured', { feature, email });
        }
      } else {
        setError(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Email submission error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box variant="gradient" className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          PRO
        </span>
      </div>
      
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <current.icon className="h-8 w-8 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{current.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{context}</p>
          
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">Example:</p>
            <p className="text-sm text-gray-700 italic">"{current.example}"</p>
          </div>
          
          {isSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 font-medium">
                ✅ Thanks! We'll notify you when this feature launches.
              </p>
            </div>
          ) : !showInterest ? (
            <button
              onClick={handleNotifyMe}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Notify me when available →
            </button>
          ) : (
            <div className="space-y-2">
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Notify Me'}
                </button>
              </form>
              
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};
