'use client';

import React from 'react';
import { 
  XMarkIcon,
  ChartBarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { FinancialSnapshotOffer } from '../FinancialSnapshotOffer';

interface FinancialSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialSnapshotModal: React.FC<FinancialSnapshotModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-100 bg-opacity-95 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full min-h-[85vh] max-h-[95vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="text-center pt-10 pb-8 px-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <SparklesIcon className="h-10 w-10 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">Make This Dashboard Yours</span>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              You've seen the <span className="text-blue-600">demo</span> — now get your <span className="text-purple-600">real data</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Instead of estimates and mock data, see your actual financial picture in 2 minutes
            </p>
          </div>

          {/* Before/After comparison */}
          <div className="px-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demo data side */}
              <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                  What you see now (Demo)
                </h3>
                <ul className="space-y-3 text-base text-gray-600">
                  <li>• Mock transactions</li>
                  <li>• Estimated spending categories</li>
                  <li>• Generic financial runway</li>
                  <li>• Sample insights</li>
                </ul>
              </div>

              {/* Real data side */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="h-6 w-6 text-blue-600" />
                  What you'll get (Real Data)
                </h3>
                <ul className="space-y-3 text-base text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    Your actual bank transactions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    Real spending patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    Your exact financial runway
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    Personalized insights & opportunities
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Value proposition */}
          <div className="px-8 mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <ClockIcon className="h-6 w-6 text-orange-600" />
                Why people love their Financial Snapshot:
              </h4>
              <div className="text-base text-gray-700 space-y-2">
                <p>💡 "Found $180/month in subscriptions I forgot about" - Sarah M.</p>
                <p>📈 "Realized I had 18 months runway, not 6!" - David K.</p>
                <p>🎯 "Finally understand where my money actually goes" - Lisa R.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-8 pb-10">
            <FinancialSnapshotOffer onPurchaseClick={onClose} />
            
            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="text-base text-gray-500 hover:text-gray-700 underline"
              >
                Maybe later, let me explore the demo more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
