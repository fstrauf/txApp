'use client';

import React from 'react';
import { useScreenNavigation } from '../hooks/useScreenNavigation';

const ProgressBar: React.FC = () => {
  const { getProgress } = useScreenNavigation();
  const progress = getProgress();

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full my-4">
      <div
        className="h-full bg-linear-to-r from-primary to-secondary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
