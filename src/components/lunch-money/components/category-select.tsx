import React from 'react';
import { Category } from '../types';

type CategorySelectProps = {
  transaction: {
    lunchMoneyId: string;
    originalData?: any;
  };
  categories: (string | Category)[];
  handleCategoryChange: (transactionId: string, categoryValue: string) => void;
  updatingCategory: string | null;
  successfulUpdates: Record<string, boolean>;
  hasPendingUpdate: boolean;
};

export default function CategorySelect({
  transaction,
  categories,
  handleCategoryChange,
  updatingCategory,
  successfulUpdates,
  hasPendingUpdate
}: CategorySelectProps) {
  const selectedValue = transaction.originalData?.category_id ? 
                        String(transaction.originalData.category_id) : 
                        "none";

  return (
    <div className="relative">
      <select
        value={selectedValue}
        onChange={(e) => handleCategoryChange(transaction.lunchMoneyId, e.target.value)}
        disabled={updatingCategory === transaction.lunchMoneyId}
        className={`w-full py-1.5 px-2 pr-8 appearance-none rounded-md border text-sm shadow-sm focus:ring-primary focus:border-primary ${
          successfulUpdates[transaction.lunchMoneyId] 
            ? 'border-green-500 bg-green-50 text-green-800' 
            : hasPendingUpdate
              ? 'border-secondary bg-secondary/5 text-secondary-dark'
              : 'border-gray-300 bg-white text-gray-800'
        }`}
      >
        <option value="none">-- Uncategorized --</option>
        {categories.map(category => {
          const categoryId = typeof category === 'string' ? category : String(category.id);
          const categoryName = typeof category === 'string' ? category : category.name;
          
          return (
            <option key={categoryId} value={categoryId}>
              {categoryName}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* Loading spinner */}
      {updatingCategory === transaction.lunchMoneyId && (
        <div className="absolute right-0 top-0 h-full flex items-center pr-8">
          <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Success checkmark */}
      {successfulUpdates[transaction.lunchMoneyId] && (
        <div className="absolute right-0 top-0 h-full flex items-center pr-8">
          <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
} 