"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Calculator, Target, TrendingUp } from 'lucide-react';

interface SmartBlogToastProps {
  postTitle: string;
  onClose?: () => void;
}

const SmartBlogToast: React.FC<SmartBlogToastProps> = ({ postTitle, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(scrollPercent);

      // Show toast when user has read 60% of the article
      if (scrollPercent > 60 && !visible) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  const getContextualMessage = () => {
    const title = postTitle.toLowerCase();
    
    if (title.includes('fire') || title.includes('independence') || title.includes('freedom')) {
      return {
        icon: Target,
        title: "Ready to calculate your freedom number?",
        description: "See exactly how much you need for financial independence",
        cta: "Calculate My F*** You Money",
        href: "/personal-finance",
        color: "from-primary to-secondary"
      };
    }
    
    if (title.includes('budget') || title.includes('expense') || title.includes('categor')) {
      return {
        icon: Calculator,
        title: "Tired of manual expense tracking?",
        description: "Let AI categorize your transactions automatically",
        cta: "Try Free AI Categorization",
        href: "/personal-finance",
        color: "from-primary to-secondary"
      };
    }
    
    return {
      icon: TrendingUp,
      title: "How long could you survive without income?",
      description: "Calculate your personal runway in 2 minutes",
      cta: "Calculate My Runway",
      href: "/personal-finance",
      color: "from-primary to-secondary"
    };
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  const message = getContextualMessage();
  const IconComponent = message.icon;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 mx-auto sm:left-auto sm:right-6 sm:mx-0 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-300 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="p-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <XMarkIcon className="h-4 w-4 text-gray-500" />
        </button>
        
        {/* Content */}
        <div className="pr-8">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">
            {message.title}
          </h3>
          
          <p className="text-xs text-gray-600 mb-3">
            {message.description}
          </p>
          
          <Link 
            href={message.href}
            className={`inline-flex items-center bg-gradient-to-r ${message.color} text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200`}
          >
            {message.cta}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SmartBlogToast; 