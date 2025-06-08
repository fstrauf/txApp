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
    <div className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg max-w-sm border border-indigo-500/20 backdrop-blur-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <SparklesIcon className="h-8 w-8 text-yellow-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            Ready to transform your financial habits?
          </h3>
          <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
          Answer a few questions and discover exactly where your money goes.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link 
              href="/personal-finance" 
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm text-center"
            >
              Free Finance Checkup
            </Link>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 text-indigo-200 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default IntegrationsToast;
