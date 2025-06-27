import React from 'react';
import { 
  ChartBarIcon, 
  CreditCardIcon, 
  ChartPieIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface TabNavigationProps {
  activeTab: 'overview' | 'transactions' | 'portfolio' | 'ai-insights';
  setActiveTab: (tab: 'overview' | 'transactions' | 'portfolio' | 'ai-insights') => void;
  transactionCount: number;
  hasPortfolioData: boolean;
  isFirstTimeUser: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  transactionCount,
  hasPortfolioData,
  isFirstTimeUser
}) => {
  const tabs = [
    {
      id: 'overview' as const,
      name: 'Overview',
      icon: ChartBarIcon,
    },
    {
      id: 'portfolio' as const,
      name: 'Portfolio',
      icon: ChartPieIcon,
      isNew: true
    }
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  transition-all duration-200
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`
                    h-5 w-5 
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} 
                />
                <span>{tab.name}</span>
                
                {/* New badge for portfolio tab */}
                {tab.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    New
                  </span>
                )}

                
                {/* Demo badge for first-time users */}
                {isFirstTimeUser && (tab.id === 'portfolio' || tab.id === 'overview') && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Demo
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>      
    </div>
  );
}; 