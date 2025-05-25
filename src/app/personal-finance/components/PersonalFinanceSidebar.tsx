'use client';

import React, { useState } from 'react';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import type { Screen } from '../hooks/useScreenNavigation';

interface NavigationItem {
  screen: Screen;
  title: string;
  icon: string;
  description: string;
  category: 'setup' | 'analysis' | 'optimization';
  isAccessible: (userData: any) => boolean;
}

const navigationItems: NavigationItem[] = [
  {
    screen: 'welcome',
    title: 'Welcome',
    icon: '👋',
    description: 'Getting started',
    category: 'setup',
    isAccessible: () => true,
  },
  {
    screen: 'income',
    title: 'Income',
    icon: '💰',
    description: 'Monthly income setup',
    category: 'setup',
    isAccessible: () => true,
  },
  {
    screen: 'spending',
    title: 'Spending',
    icon: '💳',
    description: 'Monthly expenses',
    category: 'setup',
    isAccessible: () => true,
  },
  {
    screen: 'savings',
    title: 'Savings',
    icon: '🏦',
    description: 'Current savings amount',
    category: 'setup',
    isAccessible: () => true,
  },
  {
    screen: 'initialInsights',
    title: 'Your Insights',
    icon: '💡',
    description: 'Financial health overview',
    category: 'analysis',
    isAccessible: (userData) => userData.income && userData.spending && userData.savings !== null,
  },
  {
    screen: 'spendingAnalysisUpload',
    title: 'Spending Analysis',
    icon: '📊',
    description: 'Upload bank data',
    category: 'analysis',
    isAccessible: (userData) => userData.income && userData.spending,
  },
  {
    screen: 'spendingAnalysisResults',
    title: 'Spending Results',
    icon: '📈',
    description: 'Spending breakdown',
    category: 'analysis',
    isAccessible: (userData) => userData.income && userData.spending,
  },
  {
    screen: 'savingsAnalysisInput',
    title: 'Savings Analysis',
    icon: '🎯',
    description: 'Asset allocation',
    category: 'optimization',
    isAccessible: (userData) => userData.savings > 0,
  },
  {
    screen: 'savingsAnalysisResults',
    title: 'Optimization Plan',
    icon: '🚀',
    description: 'Investment strategy',
    category: 'optimization',
    isAccessible: (userData) => userData.savings > 0 && userData.savingsBreakdown,
  },
];

const categoryLabels = {
  setup: 'Basic Setup',
  analysis: 'Analysis',
  optimization: 'Optimization',
};

const categoryIcons = {
  setup: '⚙️',
  analysis: '🔍',
  optimization: '🎯',
};

export function PersonalFinanceSidebar() {
  const { currentScreen, goToScreen } = useScreenNavigation();
  const { userData } = usePersonalFinanceStore();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Group navigation items by category
  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const getCurrentStepInfo = () => {
    const currentItem = navigationItems.find(item => item.screen === currentScreen);
    if (!currentItem) return null;

    const categoryItems = groupedItems[currentItem.category] || [];
    const currentIndex = categoryItems.findIndex(item => item.screen === currentScreen);
    const totalInCategory = categoryItems.length;

    return {
      category: currentItem.category,
      step: currentIndex + 1,
      total: totalInCategory,
      title: currentItem.title,
      description: currentItem.description,
    };
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-200 shadow-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 
        transition-all duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-16 w-80' : 'md:w-80 w-80'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Personal Finance</h2>
                  <p className="text-sm text-gray-500">Financial health check</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Desktop Collapse Button */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:block p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Current Progress */}
          {!isCollapsed && stepInfo && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {categoryLabels[stepInfo.category as keyof typeof categoryLabels]}
                </span>
                <span className="text-xs text-gray-500">
                  {stepInfo.step} of {stepInfo.total}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {categoryIcons[stepInfo.category as keyof typeof categoryIcons]}
                  </span>
                  <span className="font-semibold text-gray-800">{stepInfo.title}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{stepInfo.description}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stepInfo.step / stepInfo.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  {!isCollapsed && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
                      <span className="mr-2">
                        {categoryIcons[category as keyof typeof categoryIcons]}
                      </span>
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h3>
                  )}
                  
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isAccessible = item.isAccessible(userData);
                      const isCurrent = currentScreen === item.screen;
                      
                      const tooltipText = isCollapsed 
                        ? `${item.title} - ${item.description}${!isAccessible ? ' (Locked: Complete previous steps)' : ''}`
                        : undefined;
                       return (
                        <div key={item.screen} className="relative group">
                          <button
                            onClick={() => {
                              if (isAccessible) {
                                goToScreen(item.screen);
                                setIsMobileOpen(false); // Close mobile menu on navigation
                              }
                            }}
                            disabled={!isAccessible}
                            className={`w-full flex items-center justify-center md:justify-start px-3 py-3 rounded-lg text-sm transition-all duration-200 text-left relative overflow-visible
                              ${isCurrent ? 'text-indigo-700 font-semibold' :
                                isAccessible ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm' :
                                'text-gray-400 cursor-not-allowed'}
                            `}
                            title={tooltipText}
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            {/* Slim blue bar for current screen */}
                            {isCurrent && (
                              <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-blue-500 z-10"></div>
                            )}
                            <span className={`text-lg flex-shrink-0 z-10 mx-auto md:mx-0 ${!isAccessible ? 'opacity-50' : ''}`}>{item.icon}</span>
                            {!isCollapsed && (
                              <div className="ml-3 flex-1 min-w-0 z-10">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium truncate ${!isAccessible ? 'opacity-50' : ''}`}>{item.title}</span>
                                  {isCurrent && (
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 animate-pulse"></span>
                                  )}
                                </div>
                                <p className={`text-xs ${isCurrent ? 'text-indigo-600' : 'text-gray-500'} truncate ${!isAccessible ? 'opacity-50' : ''}`}>{item.description}</p>
                              </div>
                            )}
                            {!isAccessible && !isCollapsed && (
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </button>
                          {/* Tooltip for collapsed state - fixed positioning, always on top */}
                          {isCollapsed && (
                            <div className="fixed left-16 md:left-20 top-auto z-[9999] pointer-events-none group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 invisible opacity-0 transition-all duration-200"
                              style={{ minWidth: '14rem', marginTop: '-1.5rem', marginLeft: '0.5rem' }}
                            >
                              <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 relative">
                                <div className="font-semibold text-white">{item.title}</div>
                                <div className="text-gray-300 text-xs mt-1">{item.description}</div>
                                {!isAccessible && (
                                  <div className="text-red-300 text-xs mt-2 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Complete previous steps
                                  </div>
                                )}
                                {/* Tooltip arrow */}
                                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer - Quick Data Summary */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Data</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-medium text-gray-800">
                      {userData.income ? `$${userData.income.toLocaleString()}` : '—'}
                    </p>
                    <p className="text-gray-500">Income</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-800">
                      {userData.spending ? `$${userData.spending.toLocaleString()}` : '—'}
                    </p>
                    <p className="text-gray-500">Spending</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-800">
                      {userData.savings !== null && userData.savings !== undefined ? `$${userData.savings.toLocaleString()}` : '—'}
                    </p>
                    <p className="text-gray-500">Savings</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
