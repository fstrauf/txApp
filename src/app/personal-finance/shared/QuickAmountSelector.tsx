import React from 'react';
import { Button } from '@headlessui/react';

export interface QuickAmountSelectorProps {
  amounts?: number[];
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  className?: string;
}

export const QuickAmountSelector: React.FC<QuickAmountSelectorProps> = ({ 
  amounts = [3000, 4500, 6000, 7500, 9000, 12000], 
  selectedAmount, 
  onSelect,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 ${className}`}>
      {amounts.map((amount) => (
        <Button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
          className={`px-4 py-4 border border-gray-200 rounded-xl text-center cursor-pointer 
                     transition-all duration-200 font-medium text-base
                     hover:border-primary hover:bg-primary-50 hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20
                     ${selectedAmount === amount 
                       ? 'bg-primary text-white border-primary shadow-md' 
                       : 'bg-white text-gray-700'
                     }`}
        >
          ${amount >= 1000 ? `${Math.floor(amount/1000)}k` : amount.toLocaleString()}
          {amount >= 12000 && '+'}
        </Button>
      ))}
    </div>
  );
}; 