import React from 'react';
import Link from 'next/link';
import { Calculator, Target, TrendingUp } from 'lucide-react';

interface InlineToolCalloutProps {
  type: 'runway' | 'freedom' | 'categorize';
  context?: string;
}

const InlineToolCallout: React.FC<InlineToolCalloutProps> = ({ type, context }) => {
  const configs = {
    runway: {
      icon: TrendingUp,
      title: 'Personal Runway Calculator',
      description: 'How many months could you survive without income?',
      cta: 'Calculate My Runway',
      href: '/personal-finance',
      color: 'from-green-500 to-emerald-500'
    },
    freedom: {
      icon: Target,
      title: 'F*** You Money Calculator',
      description: 'Your exact financial independence number',
      cta: 'Calculate Now',
      href: '/fuck-you-money-sheet',
      color: 'from-purple-500 to-pink-500'
    },
    categorize: {
      icon: Calculator,
      title: 'AI Expense Categorization',
      description: 'Automatically categorize your expenses with AI',
      cta: 'Try Free',
      href: '/personal-finance',
      color: 'from-blue-500 to-indigo-500'
    }
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 my-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{config.title}</h4>
          <p className="text-gray-600 text-sm mb-3">{config.description}</p>
          {context && (
            <p className="text-xs text-gray-500 mb-3 italic">💡 {context}</p>
          )}
          <Link
            href={config.href}
            className={`inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${config.color} text-white text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
          >
            {config.cta}
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InlineToolCallout; 