// src/app/personal-finance/page.tsx
'use client';

import React, { Suspense } from 'react';
import DashboardScreen from '@/app/personal-finance/screens/DashboardScreen';
import { DataPersistenceIndicator } from '@/app/personal-finance/components/DataPersistenceIndicator';

const PersonalFinancePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <DashboardScreen />
        </div>
        
        {/* Data Persistence Indicator */}
        <DataPersistenceIndicator />
      </div>
    </Suspense>
  );
};

export default PersonalFinancePage;