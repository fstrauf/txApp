import React from 'react';
import { DocumentPlusIcon, PlayIcon } from '@heroicons/react/24/outline';
import { mockSavingsData } from '../../utils/mockData';

interface DemoBannerProps {
  headlineText: string;
  ctaButtonText: string;
  onCtaClick: () => void;
  onHowItWorksClick: () => void;
  isLoading: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  headlineText,
  ctaButtonText,
  onCtaClick,
  onHowItWorksClick,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
      {/* Welcome Header */}
      <div className="text-center mb-6">
        <p className="text-gray-600 text-lg mb-4">
          This demo shows what <strong>YOUR</strong> dashboard could look like.
        </p>
        <p className="text-gray-800 text-lg font-medium">
          To see your actual runway:
        </p>
      </div>

      {/* Step Flow */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
          <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
          <span className="font-medium text-gray-800">Get Your Free Sheet</span>
        </div>
        <span className="hidden sm:block text-gray-400 text-xl">→</span>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
          <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
          <span className="font-medium text-gray-800">Upload Bank CSV</span>
        </div>
        <span className="hidden sm:block text-gray-400 text-xl">→</span>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
          <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
          <span className="font-medium text-gray-800">See Real Results</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <button
          onClick={onCtaClick}
          disabled={isLoading}
          className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto text-base sm:text-lg"
        >
          <DocumentPlusIcon className="h-5 w-5" />
          <span>Start Free Setup (3 min)</span>
        </button>
        <button
          onClick={onHowItWorksClick}
          className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium w-full sm:w-auto text-sm sm:text-base"
        >
          <PlayIcon className="h-5 w-5" />
          Watch 90-Second Setup Video
        </button>
      </div>
    </div>
  );
}; 