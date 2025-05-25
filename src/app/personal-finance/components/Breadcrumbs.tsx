'use client';

import React from 'react';
import { useScreenNavigation } from '../hooks/useScreenNavigation';

interface BreadcrumbItem {
  label: string;
  screen?: string;
  isActive: boolean;
}

const screenBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  welcome: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Welcome', isActive: true },
  ],
  income: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Setup', isActive: false },
    { label: 'Income', isActive: true },
  ],
  spending: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Setup', isActive: false },
    { label: 'Spending', isActive: true },
  ],
  savings: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Setup', isActive: false },
    { label: 'Savings', isActive: true },
  ],
  initialInsights: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Analysis', isActive: false },
    { label: 'Your Insights', isActive: true },
  ],
  spendingAnalysisUpload: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Analysis', isActive: false },
    { label: 'Spending Analysis', isActive: true },
  ],
  spendingAnalysisResults: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Analysis', isActive: false },
    { label: 'Spending Results', isActive: true },
  ],
  savingsAnalysisInput: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Optimization', isActive: false },
    { label: 'Savings Analysis', isActive: true },
  ],
  savingsAnalysisResults: [
    { label: 'Personal Finance', isActive: false },
    { label: 'Optimization', isActive: false },
    { label: 'Optimization Plan', isActive: true },
  ],
};

export function Breadcrumbs() {
  const { currentScreen, goToScreen } = useScreenNavigation();
  
  const breadcrumbs = screenBreadcrumbs[currentScreen] || [
    { label: 'Personal Finance', isActive: false },
    { label: 'Unknown', isActive: true },
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span
            className={`${
              item.isActive
                ? 'text-gray-900 font-medium'
                : item.screen
                ? 'text-gray-500 hover:text-gray-700 cursor-pointer'
                : 'text-gray-500'
            }`}
            onClick={() => item.screen && goToScreen(item.screen as any)}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
