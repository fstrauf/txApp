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
      description: 'We create a template in your Google Drive that you own completely'
    },
    {
      icon: SparklesIcon,
      title: 'AI categorizes all transactions',
      description: 'Smart categorization learns from your spending patterns'
    },
    {
      icon: ChartBarIcon,
      title: 'This exact dashboard with YOUR data',
      description: 'See your real financial freedom runway and spending insights'
    },
    {
      icon: CalendarIcon,
      title: 'Monthly runway calculation',
      description: 'Know exactly how long your money will last at current spending'
    },
    {
      icon: ShieldCheckIcon,
      title: '100% private - data stays in your Google Drive',
      description: 'We analyze it, but YOU own it. Delete anytime.'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What You'll Get</h3>
        <p className="text-gray-600">Everything you need to understand your financial runway</p>
      </div>

      <div className="grid gap-4 mb-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">✓ {benefit.title}</h4>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={onGetStartedClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <DocumentTextIcon className="h-5 w-5" />
          Get Your Free Google Sheet
        </button>
        <p className="text-sm text-gray-500 mt-2">Join 500+ people who discovered their runway this week</p>
      </div>
    </div>
  );
}; 