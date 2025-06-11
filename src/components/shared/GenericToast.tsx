"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GenericToastProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  delay?: number; // Delay in milliseconds before showing, default 10 seconds
  highlightText?: string; // Optional text to highlight in the title
  onClose?: () => void; // Optional callback when toast is closed
}

const GenericToast: React.FC<GenericToastProps> = ({
  title,
  description,
  ctaText,
  ctaHref,
  delay = 10000,
  highlightText,
  onClose
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  // Split title around highlight text if provided
  const renderTitle = () => {
    if (!highlightText || !title.includes(highlightText)) {
      return title;
    }
    
    const parts = title.split(highlightText);
    return (
      <>
        {parts[0]}
        <span className="text-yellow-300">{highlightText}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-gradient-to-br from-primary via-primary-dark to-secondary text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md z-50">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-secondary/20 rounded-full blur-lg"></div>
        
        <div className="relative p-5">
          {/* Close button positioned absolutely in top-right */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
          
          <div className="text-center px-6">
            <h3 className="font-bold text-xl mb-3 leading-tight">
              {renderTitle()}
            </h3>
            <p className="text-sm text-white/90 mb-5 leading-relaxed">
              {description}
            </p>
            <Link 
              href={ctaHref}
              className="inline-flex items-center justify-center bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center group whitespace-nowrap"
            >
              {ctaText}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericToast; 