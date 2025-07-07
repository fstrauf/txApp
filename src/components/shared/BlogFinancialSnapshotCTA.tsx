'use client';

import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import posthog from 'posthog-js';

interface BlogFinancialSnapshotCTAProps {
  className?: string;
  source?: string; // Track which blog post this comes from
}

export const BlogFinancialSnapshotCTA: React.FC<BlogFinancialSnapshotCTAProps> = ({
  className = "",
  source = "blog_post"
}) => {

  const handleClick = () => {
    posthog.capture('blog_financial_snapshot_cta_clicked', {
      source: source,
      cta_location: 'blog_post'
    });
  };

  return (
    <div className={`my-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-lg font-semibold text-blue-600">Get Your Financial Snapshot</span>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Want These Insights Without the Spreadsheet Work?
        </h3>
        
        <p className="text-gray-600 text-lg mb-4">
          Get your complete Financial Snapshot in 2 minutes.
        </p>

        <div className="flex items-center justify-center gap-6 mb-6 text-gray-700">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium">Upload your bank CSV</span>
          </div>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium">See your exact runway</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-purple-600" />
            <span className="font-medium">Find hidden savings</span>
          </div>
        </div>

        <Link 
          href="/personal-finance?offer=snapshot"
          onClick={handleClick}
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 gap-2"
        >
          Get My Financial Snapshot - $49
          <ArrowRightIcon className="h-5 w-5" />
        </Link>

        <div className="mt-4">
          <p className="text-sm text-gray-500">
            🔒 Secure • 💰 30-day guarantee • ⚡ Instant results
          </p>
        </div>
      </div>
    </div>
  );
};
