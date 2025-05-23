'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

// Define props type to include className
interface ProgressBarProps {
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ className = "" }) => {
  const progress = usePersonalFinanceStore((state) => state.progress);

  return (
    <div className={`w-full h-1 bg-gray-200 ${className}`}> {/* Removed fixed positioning, added className */}
      <div
        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out" // Updated to-green-600
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
