import React from 'react';
import { OperationType } from '../types';

type ProgressModalProps = {
  operationInProgress: boolean;
  operationType: OperationType;
  progressPercent: number;
  progressMessage: string;
};

export default function ProgressModal({
  operationInProgress,
  operationType,
  progressPercent,
  progressMessage
}: ProgressModalProps) {
  if (!operationInProgress) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-surface p-6 rounded-xl shadow-soft w-96 max-w-full">
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg text-gray-800">
            {operationType === 'training' ? 'Training Model' : 'Categorizing Transactions'}
          </h3>
          <p className="text-gray-600 text-sm mt-2">{progressMessage}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div 
            className="h-3 rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 text-right">
          {progressPercent}%
        </p>
      </div>
    </div>
  );
} 