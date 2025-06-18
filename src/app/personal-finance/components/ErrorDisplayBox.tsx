'use client';

import React from 'react';
import { 
  ExclamationTriangleIcon,
  LinkIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { Box } from '@/components/ui/Box';

interface ErrorInfo {
  error?: string;
  errorType?: string;
  details?: string;
  reasons?: string[];
  suggestions?: string[];
  requiresNewSpreadsheet?: boolean;
}

interface ErrorDisplayBoxProps {
  error: string | null;
  onRetry?: () => void;
  onCreateNew?: () => void;
  onRelink?: () => void;
  onClear?: () => void;
  className?: string;
  showCreateNewButton?: boolean;
  showRelinkButton?: boolean;
}

export const ErrorDisplayBox: React.FC<ErrorDisplayBoxProps> = ({
  error,
  onRetry,
  onCreateNew,
  onRelink,
  onClear,
  className = '',
  showCreateNewButton = true,
  showRelinkButton = true
}) => {
  if (!error) return null;

  // Parse error for detailed error information
  const parseErrorInfo = (errorString: string): ErrorInfo => {
    try {
      // Check if it's a JSON error with detailed info
      if (errorString.startsWith('{')) {
        const errorObj = JSON.parse(errorString);
        return errorObj;
      }
    } catch {
      // Fall back to string parsing
    }
    
    // Legacy error checking
    return {
      error: errorString,
      errorType: errorString.includes('access expired') || 
                errorString.includes('expired') || 
                errorString.includes('401') ? 'AUTH_EXPIRED' : 'UNKNOWN'
    };
  };

  const errorInfo = parseErrorInfo(error);
  const isExpiredAccessError = errorInfo?.errorType === 'AUTH_EXPIRED';
  const isAccessDeniedError = errorInfo?.errorType === 'ACCESS_DENIED' || errorInfo?.errorType === 'PERMISSION_DENIED';
  const isIncompatibleFormatError = errorInfo?.errorType === 'INCOMPATIBLE_FORMAT';
  const isStructureMismatchError = errorInfo?.errorType === 'STRUCTURE_MISMATCH';

  return (
    <Box variant="error" padding="md" className={`mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium mb-1">
            {errorInfo?.error || 'Connection Error'}
          </p>
          
          {/* Main error message */}
          {errorInfo?.details && (
            <p className="text-sm mb-3">{errorInfo.details}</p>
          )}
          
          {/* Reasons why this happened */}
          {errorInfo?.reasons && errorInfo.reasons.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">This could be because:</p>
              <ul className="text-sm space-y-1">
                {errorInfo.reasons.map((reason: string, index: number) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suggestions */}
          {errorInfo?.suggestions && errorInfo.suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Try these solutions:</p>
              <ul className="text-sm space-y-1">
                {errorInfo.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-1">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Action buttons based on error type */}
          <div className="flex flex-wrap gap-3 mt-4">
            {/* Re-link button for expired access */}
            {isExpiredAccessError && showRelinkButton && onRelink && (
              <button
                onClick={onRelink}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <LinkIcon className="h-4 w-4" />
                Re-link Spreadsheet
              </button>
            )}
            
            {/* Create new spreadsheet button for format issues */}
            {(isIncompatibleFormatError || isStructureMismatchError) && showCreateNewButton && onCreateNew && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white text-sm rounded-lg transition-all duration-200"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                Create New Spreadsheet
              </button>
            )}
            
            {/* Retry button for general errors */}
            {onRetry && !isIncompatibleFormatError && !isStructureMismatchError && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            )}
            
            {/* Clear error button */}
            {onClear && (
              <button
                onClick={onClear}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Dismiss
              </button>
            )}
          </div>
          
          {/* Fallback for simple error strings */}
          {!errorInfo?.details && !errorInfo?.error && (
            <p className="text-sm">{error}</p>
          )}
        </div>
      </div>
    </Box>
  );
};

export default ErrorDisplayBox; 