'use client';

import React, { Suspense } from 'react';
import DashboardScreen from '@/app/personal-finance/screens/DashboardScreen';

const PersonalFinancePageClient: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <DashboardScreen />
        </div>
      </div>
    </Suspense>
  );
};

export default PersonalFinancePageClient; 