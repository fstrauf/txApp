import React from 'react';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  CalendarIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface WhatYouGetSectionProps {
  onGetStartedClick: () => void;
}

export const WhatYouGetSection: React.FC<WhatYouGetSectionProps> = ({
  onGetStartedClick
}) => {
  const benefits = [
    {
      icon: DocumentTextIcon,
      title: 'Your own Google Sheet (keep forever)',
      description: 'We create a template in your Google Drive that you own completely',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      icon: SparklesIcon,
      title: 'AI categorizes all transactions',
      description: 'Smart categorization learns from your spending patterns',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary'
    },
    {
      icon: ChartBarIcon,
      title: 'This exact dashboard with YOUR data',
      description: 'See your real financial freedom runway and spending insights',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      icon: CalendarIcon,
      title: 'Monthly runway calculation',
      description: 'Know exactly how long your money will last at current spending',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Private - data stays in your Google Drive',
      description: 'We analyze it, but YOU own it. Delete anytime.',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    ,
    {
      icon: ShieldCheckIcon,
      title: 'Know how you are saving',
      description: 'Portfolio tracking to break down your savings',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    }
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8 mt-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">What You'll Get</h3>
          <p className="text-gray-600">Everything you need to understand your financial runway</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit?.icon;
            return (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 ${benefit?.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${benefit?.iconColor}`} />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{benefit?.title}</h4>
                  <p className="text-sm text-gray-600">{benefit?.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={onGetStartedClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Get Your Free Google Sheet
          </button>
          <p className="text-sm text-gray-500 mt-3">Join 500+ people who discovered their runway this week</p>
        </div>
      </div>

      {/* Animated Call-to-Action for Demo Data */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-pulse">
              <svg 
                className="w-6 h-6 text-primary animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800">
              <span className="text-primary font-semibold">Check out the dashboard</span> with demo data below
            </p>
            <div className="animate-pulse">
              <svg 
                className="w-6 h-6 text-secondary animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ animationDelay: '0.2s' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            See exactly what your financial freedom dashboard will look like
          </p>
        </div>
      </div>
    </>
  );
}; 