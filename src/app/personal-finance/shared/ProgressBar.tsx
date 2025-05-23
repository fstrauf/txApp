'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

const ProgressBar: React.FC = () => {
  const progress = usePersonalFinanceStore((state) => state.progress);

  return (
    <div className="w-full h-1 bg-gray-200 fixed top-0 left-0 z-50">
      <div
        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
