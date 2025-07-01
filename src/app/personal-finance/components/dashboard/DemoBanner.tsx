import React from 'react';
import { DocumentPlusIcon, PlayIcon, SparklesIcon } from '@heroicons/react/24/outline';


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
    <div className="relative mb-16 md:mb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl"></div>
      
      {/* Main content */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-primary/10 shadow-2xl p-8 md:p-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Live Demo Dashboard
            </span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            How Much{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Time</span>{" "}
            Can Your Money Buy?
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            This demo shows what <span className="font-semibold text-primary">YOUR</span> dashboard could look like.
            Calculate your real financial runway in just 3 minutes.
          </p>
        </div>

        {/* Step Flow - Redesigned */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-900">Get Your Free Sheet</h3>
                    <p className="text-sm text-gray-600">Instant Google Sheets template</p>
                  </div>
                </div>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-gray-400 font-bold">→</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-900">Upload Bank CSV</h3>
                    <p className="text-sm text-gray-600">AI categorizes everything</p>
                  </div>
                </div>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-gray-400 font-bold">→</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-900">See Real Results</h3>
                  <p className="text-sm text-gray-600">Your actual runway revealed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons - Redesigned */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onCtaClick}
            disabled={isLoading}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto text-lg"
          >
            <DocumentPlusIcon className="h-5 w-5" />
            <span>{ctaButtonText}</span>
          </button>
          
          <button
            onClick={onHowItWorksClick}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto text-lg"
          >
            <PlayIcon className="h-5 w-5" />
            Watch Demo Video
          </button>
        </div>

        {/* Trust indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50">
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <span>Your data stays in YOUR Google Sheet</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 