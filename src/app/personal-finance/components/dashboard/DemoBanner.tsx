import React from 'react';
import { DocumentPlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
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
    <div className="bg-gradient-to-r from-primary to-secondary-dark rounded-xl p-4 sm:p-8 border border-primary-light mb-6 sm:mb-8 shadow-lg overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <div className="flex-shrink-0 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{headlineText}</h3>
          <p className="text-blue-100 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
            You're looking at <strong>real financial freedom</strong> — this demo shows <strong>{mockSavingsData.runwayMonths} months of "F*** You Money"</strong>.
            That's {Math.round(mockSavingsData.runwayMonths / 12 * 10) / 10} years of complete independence. 
            <span className="font-bold text-white"> What if this was YOUR actual runway?</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onCtaClick}
              disabled={isLoading}
              className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-4 bg-white text-primary-dark rounded-xl hover:bg-blue-50 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto text-base sm:text-lg"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              <span className="relative">
                {ctaButtonText}
                <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
              </span>
            </button>
            <button
              onClick={onHowItWorksClick}
              className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm border border-white/30 w-full sm:w-auto text-sm sm:text-base"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
              See How It Works
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 