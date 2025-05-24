import { Box } from '@/components/ui/Box';
import React from 'react';

export interface ParameterCardProps {
  label: string;
  value: number | string;
  subtext?: string;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({ 
  label, 
  value, 
  subtext, 
}) => {
  return (
    <Box variant="gradient" className="rounded-xl p-6 text-center">
      <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
      </div>
      {subtext && (
        <div className="text-xs text-gray-400">
          {subtext}
        </div>
      )}
    </Box>
  );
}; 