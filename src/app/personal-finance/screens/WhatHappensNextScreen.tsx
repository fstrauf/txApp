'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { Box } from '@/components/ui/Box';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { 
  EnvelopeIcon,
  BellIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  SparklesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const WhatHappensNextScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const [email, setEmail] = useState('');
  const [selectedFeatureInterest, setSelectedFeatureInterest] = useState<string[]>([]);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Mock weekly update data based on user's current data
  const weeklyUpdate = {
    spending: userData.spending * 0.25, // Weekly approximation
    change: 12,
    alerts: [
      {
        type: 'warning',
        message: userData.spending > userData.income * 0.6 
          ? 'You\'re on track to exceed your dining budget by $123'
          : 'Great week! You\'re under budget in most categories'
      },
      {
        type: 'tip',
        message: 'Cancel that unused Netflix subscription and save $19/month'
      }
    ]
  };

  const proFeatures = [
    {
      id: 'bank-sync',
      title: 'Automatic Bank Sync',
      description: 'Connect your accounts for real-time updates',
      icon: CreditCardIcon,
      savings: '$200/month in hidden subscriptions'
    },
    {
      id: 'smart-alerts',
      title: 'Smart Spending Alerts',
      description: 'Get notified before you overspend',
      icon: BellIcon,
      savings: 'Prevent 80% of budget overruns'
    },
    {
      id: 'weekly-insights',
      title: 'Weekly AI Insights',
      description: 'Personalized recommendations every Monday',
      icon: SparklesIcon,
      savings: 'Save $500+ per month on average'
    },
    {
      id: 'goal-tracking',
      title: 'Goal Progress Tracking',
      description: 'Visual progress toward your financial goals',
      icon: TrophyIcon,
      savings: 'Reach goals 3x faster'
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeatureInterest(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmail(true);
    setEmailError('');

    if (!email) {
      setEmailError('Please enter a valid email address.');
      setIsSubmittingEmail(false);
      return;
    }

    try {
      // Create email contact with specific tags for the financial course
      const response = await fetch('/api/createEmailContact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          source: 'OTHER',
          tags: [
            'email-course',
            'personal-finance',
            '4-week-course',
            'personal-finance-course',
            ...selectedFeatureInterest.map(feature => `interested-in-${feature}`)
          ]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSubmitted(true);
        setEmail(''); // Clear email input
        
        // Track successful submission
        console.log('Email course subscription successful:', { 
          email, 
          features: selectedFeatureInterest 
        });
        
        // Optional: Track with analytics
        if (typeof window !== 'undefined') {
          // window.gtag('event', 'email_course_signup', { 
          //   email, 
          //   features: selectedFeatureInterest 
          // });
        }
      } else {
        setEmailError(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Email course subscription error:', error);
      setEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <Header 
        variant="gradient"
        size="xl"
        badge={{
          text: "Your Journey Starts Now",
          variant: "success"
        }}
        subtitle="See what ongoing financial wellness looks like with ExpenseSorted Pro"
      >
        What Happens Next?
      </Header>

      {/* Mock Weekly Email Preview */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your Weekly Finance Update Preview
          </h2>
          <p className="text-gray-600">
            Imagine getting this every Monday morning
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Box variant="elevated" className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <div>
                <h3 className="font-bold text-lg">Your Weekly Finance Update</h3>
                <p className="text-sm text-gray-500">Monday, June 2nd</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Spending this week</span>
                <span className="font-bold text-red-500">
                  ${weeklyUpdate.spending.toLocaleString()} (+{weeklyUpdate.change}%)
                </span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {weeklyUpdate.alerts[0].message}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-start">
                  <LightBulbIcon className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {weeklyUpdate.alerts[1].message}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emergency fund progress</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    <span className="text-xs text-gray-500">45%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800 font-medium">
                  🎯 This Week's Challenge: Try the "52-week savings challenge" - save $1 this week!
                </p>
              </div>
            </div>
          </Box>
        </div>
      </div>

      {/* Pro Features Interest Tracker */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Which Features Interest You Most?
          </h2>
          <p className="text-gray-600">
            Click on the features you'd love to have (we'll notify you when they're ready)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {proFeatures.map((feature) => (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature.id)}
              className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedFeatureInterest.includes(feature.id)
                  ? 'ring-2 ring-indigo-500'
                  : ''
              }`}
            >
              <Box variant="default" className="p-6 h-full">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-green-800 text-xs font-medium">{feature.savings}</p>
                    </div>
                  </div>
                  {selectedFeatureInterest.includes(feature.id) && (
                    <div className="ml-2">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </Box>
            </div>
          ))}
        </div>
      </div>

      {/* Email Course Offer */}
      <div className="mb-16">
        <Box variant="gradient" className="text-center p-8">
          <CalendarDaysIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Continue Your Financial Journey
          </h2>
          <p className="text-gray-600 mb-6">
            Get a personalized 4-week email course based on your financial snapshot
          </p>
          
          <div className="space-y-3 text-left max-w-md mx-auto mb-6">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Week 1: Your spending breakdown & quick wins</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Week 2: Building your emergency fund strategy</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Week 3: Optimizing your savings & investments</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">Week 4: Your personalized 90-day action plan</span>
            </div>
          </div>
          
          {!emailSubmitted ? (
            <>
              <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border rounded-lg mb-3 disabled:opacity-50"
                  required
                  disabled={isSubmittingEmail}
                />
                {emailError && (
                  <p className="text-red-600 text-sm mb-3 text-center">{emailError}</p>
                )}
                <PrimaryButton 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmittingEmail}
                >
                  {isSubmittingEmail ? 'Subscribing...' : 'Start Free Email Course'}
                </PrimaryButton>
              </form>
              
              <p className="text-xs text-gray-500 mt-4">
                After the course, upgrade to Pro for real-time tracking
              </p>
            </>
          ) : (
            <div className="max-w-sm mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">You're all set!</h3>
                    <p className="text-sm text-green-600">Check your email for the first lesson.</p>
                  </div>
                </div>
              </div>
              {selectedFeatureInterest.length > 0 && (
                <p className="text-xs text-gray-600 text-center">
                  We'll also notify you about: {selectedFeatureInterest.join(', ')}
                </p>
              )}
            </div>
          )}
        </Box>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <PrimaryButton
          onClick={() => goToScreen('initialInsights')}
          variant="secondary"
        >
          ← Back to Insights
        </PrimaryButton>
        
        <PrimaryButton
          onClick={() => goToScreen('progressSimulator')}
          className="flex items-center gap-2"
        >
          See Your Future Progress
          <ArrowRightIcon className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
};

export default WhatHappensNextScreen;
