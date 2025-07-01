import React from 'react';
import { DocumentTextIcon, PlayIcon } from '@heroicons/react/24/outline';

interface StickyBottomBarProps {
  onGetStartedClick: () => void;
  onWatchDemoClick: () => void;
  isFirstTimeUser: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  onGetStartedClick,
  onWatchDemoClick,
  isFirstTimeUser
}) => {
  // Only show for first-time users
  if (!isFirstTimeUser) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">🎯</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ready to see YOUR real numbers?</p>
              <p className="text-sm text-gray-600">Calculate your actual financial runway</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onGetStartedClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Get Free Sheet & Start
            </button>
            <button
              onClick={onWatchDemoClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium w-full sm:w-auto"
            >
              <PlayIcon className="h-4 w-4" />
              Watch Demo First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 