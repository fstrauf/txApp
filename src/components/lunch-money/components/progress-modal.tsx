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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 max-w-full">
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg">
            {operationType === 'training' ? 'Training Model' : 'Categorizing Transactions'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{progressMessage}</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full ${operationType === 'training' ? 'bg-purple-600' : 'bg-yellow-500'}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {progressPercent}%
        </p>
      </div>
    </div>
  );
} 