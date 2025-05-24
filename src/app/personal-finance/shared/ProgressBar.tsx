'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

const ProgressBar: React.FC = () => {
  const progress = usePersonalFinanceStore((state) => state.progress);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full my-4">
      <div
        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
