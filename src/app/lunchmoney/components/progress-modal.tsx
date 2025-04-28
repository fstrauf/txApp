import React from 'react';
import { OperationType } from './types';

type ProgressModalProps = {
  operationInProgress: boolean;
  operationType: OperationType;
  progressPercent: number;
  progressMessage: string;
  isComplete: boolean;
  onClose: () => void;
};

export default function ProgressModal({
  operationInProgress,
  operationType,
  progressPercent,
  progressMessage,
  isComplete,
  onClose
}: ProgressModalProps) {
  if (!operationInProgress) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={!isComplete ? onClose : undefined}
    >
      <div 
        className="bg-surface p-6 rounded-xl shadow-soft w-96 max-w-full relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {!isComplete && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
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
        <p className="text-xs text-gray-500 text-right mb-4">
          {progressPercent}%
        </p>
        
        {isComplete && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 