"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Calculator, Target } from 'lucide-react';

interface ExitIntentModalProps {
  postTitle: string;
}

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ postTitle }) => {
  const [visible, setVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top of the page and hasn't been shown before
      if (e.clientY <= 0 && !hasShown && !visible) {
        setVisible(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, visible]);

  const getExitMessage = () => {
    const title = postTitle.toLowerCase();
    
    if (title.includes('fire') || title.includes('independence') || title.includes('freedom')) {
      return {
        title: "Wait! Before You Go...",
        subtitle: "Calculate Your Financial Freedom Number",
        description: "Since you're interested in financial independence, why not see exactly how much you need?",
        cta: "Get My F*** You Money Number",
        href: "/personal-finance",
        icon: Target,
        color: "from-primary to-secondary"
      };
    }
    
    return {
      title: "One More Thing...",
      subtitle: "Try Our Free AI Financial Analysis",
      description: "Upload your bank statements and get personalized insights in 2 minutes.",
      cta: "Analyze My Finances Free",
      href: "/personal-finance",
      icon: Calculator,
      color: "from-primary to-secondary"
    };
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  const message = getExitMessage();
  const IconComponent = message.icon;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full mx-auto shadow-2xl animate-fade-in-up">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 touch-manipulation"
          >
            <XMarkIcon className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600" />
          </button>
          
          <div className="text-center pr-2">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${message.color} flex items-center justify-center`}>
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {message.title}
            </h3>
            
            <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4 leading-tight">
              {message.subtitle}
            </h4>
            
            <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
              {message.description}
            </p>
            
            <div className="space-y-3">
              <Link
                href={message.href}
                className={`w-full inline-flex items-center justify-center bg-gradient-to-r ${message.color} text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 touch-manipulation`}
                onClick={handleClose}
              >
                <span className="text-center leading-tight">
                  {message.cta}
                </span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
              
              <button
                onClick={handleClose}
                className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-3 touch-manipulation"
              >
                No thanks, I'll continue reading
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              100% free • No credit card required • 2 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentModal; 