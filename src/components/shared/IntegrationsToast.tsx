"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const IntegrationsToast: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10000); // 10-second delay

    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-gradient-to-br from-primary via-primary-dark to-secondary text-white rounded-2xl shadow-2xl max-w-md mx-auto md:mx-0 border border-white/20 backdrop-blur-md z-50 animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-secondary/20 rounded-full blur-lg"></div>
        
        <div className="relative p-5">
          {/* Close button positioned absolutely in top-right */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
          
          <div className="text-center px-6">
            <h3 className="font-bold text-xl mb-3 leading-tight">
              Ready to transform your 
              <span className="text-yellow-300"> financial habits</span>?
            </h3>
            <p className="text-sm text-white/90 mb-5 leading-relaxed">
              Answer a few questions and discover exactly where your money goes.
            </p>
            <Link 
              href="/personal-finance" 
              className="inline-flex items-center justify-center bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center group whitespace-nowrap"
            >
              Free Finance Checkup
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

export default IntegrationsToast;
