'use client';

import React from 'react';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface HowItWorksDrawerProps {
  onClose: () => void;
}

const HowItWorksDrawer: React.FC<HowItWorksDrawerProps> = ({ onClose }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How This Works</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Keep control of your financial data in your own spreadsheet while we enhance it with powerful analytics, 
          automatic categorization, currency conversion, and bank import automation.
        </p>
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/20">
        <h3 className="text-lg font-semibold text-primary mb-3">Your Data, Enhanced</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-primary">Your Spreadsheet</h4>
              <p className="text-sm text-primary/70">Keep full control and ownership of your financial data</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h4 className="font-medium text-secondary">Our Enhancement</h4>
              <p className="text-sm text-secondary/70">Automatic categorization, analytics, and insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features We Add */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What We Add to Your Spreadsheet</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <BanknotesIcon className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Bank Import Automation</h4>
              <p className="text-xs text-gray-600">Upload CSV files from your bank and we'll add them to your sheet</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ChartBarIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">AI Categorization</h4>
              <p className="text-xs text-gray-600">Automatically categorize transactions with smart AI</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CurrencyDollarIcon className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Currency Conversion</h4>
              <p className="text-xs text-gray-600">Handle multi-currency transactions automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Workflow */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended Monthly Finance Review</h3>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Visit Personal Finance Dashboard</h4>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Come to this page once a month to review and update your finances
              </p>
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xs text-primary">
                  <strong>First time?</strong> We'll help you create a spreadsheet from our template, or you can use your existing one (must match our format)
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Upload Your Bank CSV</h4>
                <CloudArrowUpIcon className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Go to "Manage Data" and upload your monthly bank transactions CSV file
              </p>
              <div className="bg-secondary/10 rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-secondary">We automatically categorize all transactions using AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-secondary">Currency conversion happens automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-secondary">Data gets added directly to your spreadsheet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Review & Adjust (Optional)</h4>
                <ChartBarIcon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Review the AI categorization and adjust any categories if needed
              </p>
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xs text-primary">
                  Most transactions are categorized correctly, but you can fine-tune any that need adjustment
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Analyze Your Finances</h4>
                <ChartBarIcon className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use the Financial Overview to analyze your spending patterns, income, and savings
              </p>
              <div className="bg-secondary/10 rounded-lg p-3">
                <p className="text-xs text-secondary">
                  View charts, trends, and insights to make informed financial decisions
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm">
              5
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Update Your Savings</h4>
                <BanknotesIcon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Update your net asset value in the Savings tab for runway calculations
              </p>
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xs text-primary">
                  Track your total savings and see how long your money will last at current spending levels
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg p-6 border border-secondary/20">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">That's It!</h3>
          <p className="text-gray-600 mb-4">
            Just 15 minutes once a month to keep your finances organized and analyzed.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-2 rounded-full">
            <CheckCircleIcon className="w-4 h-4" />
            Your data stays in your spreadsheet, enhanced with our intelligence
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="text-center pt-4">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};

export default HowItWorksDrawer; 