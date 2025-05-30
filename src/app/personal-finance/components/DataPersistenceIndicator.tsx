// src/app/personal-finance/components/DataPersistenceIndicator.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

export const DataPersistenceIndicator: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const [showSaved, setShowSaved] = useState(false);
  const [lastDataHash, setLastDataHash] = useState('');

  // Simple hash function to detect data changes
  const hashData = (data: any) => {
    return JSON.stringify(data).length.toString();
  };

  useEffect(() => {
    const currentHash = hashData(userData);
    
    // Check if data actually changed and has meaningful content
    const hasData = userData.income > 0 || userData.spending > 0 || userData.savings > 0 || 
                   (userData.transactions && userData.transactions.length > 0);
    
    if (currentHash !== lastDataHash && hasData) {
      setShowSaved(true);
      setLastDataHash(currentHash);
      
      // Hide the indicator after 2 seconds
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userData, lastDataHash]);

  if (!showSaved) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
      <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Data saved locally
      </div>
    </div>
  );
};
