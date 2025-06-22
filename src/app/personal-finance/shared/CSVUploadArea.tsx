import React from 'react';
import { DocumentTextIcon, LockClosedIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validateCSVFile, getValidationSuggestions, type CSVValidationResult } from '@/lib/csv-validation';

export interface CSVUploadAreaProps {
  onFileSelect: (file: File) => void;
  className?: string;
  showValidationPreview?: boolean;
  isProcessing?: boolean;
  processingMessage?: string;
}

export const CSVUploadArea: React.FC<CSVUploadAreaProps> = ({ 
  onFileSelect, 
  className = "",
  showValidationPreview = true,
  isProcessing: externalProcessing = false,
  processingMessage = "Processing your file..."
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<CSVValidationResult | null>(null);
  const [validFile, setValidFile] = React.useState<File | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileValidation(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileValidation = async (file: File) => {
    setIsValidating(true);
    setValidationResult(null);
    setValidFile(null);

    try {
      const result = await validateCSVFile(file);
      setValidationResult(result);
      setValidFile(file);
      
      // For valid files or when validation preview is disabled, proceed directly to mapping
      if (result.isValid || !showValidationPreview) {
        // Don't call onFileSelect immediately - let the parent handle the processing state
        setTimeout(() => onFileSelect(file), 100);
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        fileInfo: {
          size: file.size,
          name: file.name,
          type: file.type
        }
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidation(file);
    }
  };

  const handleConfirmFile = () => {
    if (validFile) {
      // Don't call onFileSelect immediately - let the parent handle the processing state
      setTimeout(() => onFileSelect(validFile), 100);
    }
  };

  // Show validation results if available and validation preview is enabled
  if (validationResult && showValidationPreview && !validationResult.isValid) {
    return (
      <div className={`text-center my-10 ${className}`}>
        <div className="border-2 rounded-2xl p-8 bg-white">
          <div className="flex justify-center mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            File Validation Issues
          </h3>
          
          <div className="text-left max-w-2xl mx-auto space-y-4">
            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">File Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Name:</span> {validationResult.fileInfo.name}</p>
                <p><span className="font-medium">Size:</span> {(validationResult.fileInfo.size / 1024).toFixed(1)} KB</p>
                {validationResult.structure && (
                  <>
                    <p><span className="font-medium">Rows:</span> {validationResult.structure.rows.toLocaleString()}</p>
                    <p><span className="font-medium">Columns:</span> {validationResult.structure.columns}</p>
                  </>
                )}
              </div>
            </div>

            {/* Detected Patterns */}
            {validationResult.detectedPatterns && (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">✓ Detected Columns</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {validationResult.detectedPatterns.dateColumns.length > 0 && (
                    <p><strong>Date:</strong> {validationResult.detectedPatterns.dateColumns.join(', ')}</p>
                  )}
                  {validationResult.detectedPatterns.amountColumns.length > 0 && (
                    <p><strong>Amount:</strong> {validationResult.detectedPatterns.amountColumns.join(', ')}</p>
                  )}
                  {validationResult.detectedPatterns.descriptionColumns.length > 0 && (
                    <p><strong>Description:</strong> {validationResult.detectedPatterns.descriptionColumns.join(', ')}</p>
                  )}
                  {validationResult.detectedPatterns.directionColumns.length > 0 && (
                    <p><strong>Direction:</strong> {validationResult.detectedPatterns.directionColumns.join(', ')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Issues Found ({validationResult.errors.length})
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Warnings ({validationResult.warnings.length})
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 What to do next</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  <strong>Good news!</strong> Your file appears to contain transaction data. 
                  Even with validation warnings, our AI can usually map the columns correctly.
                </p>
                <ul className="space-y-1 mt-2">
                  {getValidationSuggestions(validationResult).map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={() => {
                setValidationResult(null);
                setValidFile(null);
              }}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Another File
            </button>
            
            <button
              onClick={handleConfirmFile}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue with AI Column Mapping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center my-10 ${className}`}>
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 relative
                   ${isValidating || externalProcessing
                     ? 'border-blue-400 bg-blue-50' 
                     : isDragOver 
                     ? 'border-green-500 bg-green-50' 
                     : 'border-indigo-400 bg-indigo-50 hover:border-purple-500 hover:bg-indigo-100'}`}
        onClick={() => !(isValidating || externalProcessing) && document.getElementById('csvFileInput')?.click()}
      >
        {(isValidating || externalProcessing) && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-800 font-medium">
                {isValidating ? 'Validating CSV file...' : processingMessage}
              </p>
              <p className="text-blue-600 text-sm mt-2">
                {isValidating ? 'Checking structure and detecting patterns' : 'This may take a few moments'}
              </p>
            </div>
          </div>
        )}
        
        <div className={`flex justify-center mb-6 ${(isValidating || externalProcessing) ? 'text-blue-500' : isDragOver ? 'text-green-500' : 'text-indigo-500'}`}>
          <DocumentTextIcon className="h-20 w-20" />
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-3">Drop your CSV file here</h3>
        <p className="text-lg text-gray-600 mb-6">or click to browse</p>
        <p className="text-sm text-gray-500 mb-8">
          {(isValidating || externalProcessing) ? 'Analyzing your file with AI...' : 'Supports CSV files from banks, Wise, and other financial services'}
        </p>
      
      </div>
      
      <input 
        type="file" 
        id="csvFileInput" 
        accept=".csv" 
        className="hidden" 
        onChange={handleFileInputChange}
      />
      
      <div className="mt-6 p-5 bg-green-50 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center">
          <LockClosedIcon className="h-5 w-5 text-gray-600 mr-3" />
          <div>
            <div className="font-semibold text-gray-800 text-sm">Your data stays private</div>
            <div className="text-xs text-gray-600">All analysis happens in your browser. No data is stored on our servers.</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 