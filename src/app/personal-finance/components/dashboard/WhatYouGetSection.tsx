import React from 'react';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  CalendarIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import posthog from 'posthog-js';

interface WhatYouGetSectionProps {
  onGetStartedClick: () => void;
}

export const WhatYouGetSection: React.FC<WhatYouGetSectionProps> = ({
  onGetStartedClick
}) => {
  // Track when the "What You Get" section is viewed
  React.useEffect(() => {
    posthog.capture('pf_what_you_get_section_viewed', {
      component: 'what_you_get_section'
    });
  }, []);
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
      {/* What You'll Get Section - Redesigned */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 rounded-3xl"></div>
        
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 md:p-12 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 mb-6">
              <SparklesIcon className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                What You'll Get
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Financial{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Freedom</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your complete financial runway analysis system — ready in 3 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit?.icon;
              if (!Icon) return null;
              
              return (
                <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${benefit?.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${benefit?.iconColor}`} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">{benefit?.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{benefit?.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                posthog.capture('pf_cta_clicked', {
                  component: 'what_you_get_section',
                  button_text: 'Get Your Google Sheet',
                  location: 'what_you_get_cta'
                });
                onGetStartedClick();
              }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 text-lg"
            >
              <DocumentTextIcon className="h-6 w-6" />
              Get Your Google Sheet
            </button>
            <p className="text-sm text-gray-500 mt-4">Join 500+ people who discovered their runway this week</p>
          </div>
        </div>
      </div>
    </>
  );
}; 