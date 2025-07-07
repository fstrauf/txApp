'use client';

import React, { useState, useEffect } from 'react';
import { CSVUploadArea } from '../../shared/CSVUploadArea';
import CSVPreviewTable from './CSVPreviewTable';
import { parseAccountingAmount } from '../../utils/csvUtils';
import { 
  InformationCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

export interface AnalysisResult {
  headers: string[];
  previewRows: Record<string, any>[];
  detectedDelimiter: string;
}

export interface ImportConfig {
  mappings: Record<string, 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'direction' | 'none'>;
  dateFormat: string;
  amountFormat: 'standard' | 'negate' | 'sign_column' | 'accounting_brackets';
  signColumn?: string;
  skipRows: number;
  delimiter?: string;
}

interface UploadCSVTabProps {
  createNewSpreadsheetMode: boolean;
  uploadedFile: File | null;
  csvStep: 'upload' | 'configure' | 'ready';
  analysisResult: AnalysisResult | null;
  config: Partial<ImportConfig>;
  feedback: { type: 'success' | 'error' | 'info' | 'processing'; message: string } | null;
  isProcessing: boolean;
  lastTransaction: any;
  duplicateReport: any;
  onFileSelect: (file: File) => void;
  onMappingChange: (csvHeader: string, fieldType: 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'direction' | 'none') => void;
  onProcessTransactions: () => void;
  onViewDuplicateReport: () => void;
}

const commonDateFormats = [
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS (e.g., 2023-12-31 14:30:00)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (e.g., 2023-12-31)' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (e.g., 12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (e.g., 31/12/2023)' },
  { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (e.g., 31.12.2023)' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD (e.g., 2023/12/31)' },
];

const UploadCSVTab: React.FC<UploadCSVTabProps> = ({
  createNewSpreadsheetMode,
  uploadedFile,
  csvStep,
  analysisResult,
  config,
  feedback,
  isProcessing,
  lastTransaction,
  duplicateReport,
  onFileSelect,
  onMappingChange,
  onProcessTransactions,
  onViewDuplicateReport
}) => {
  // AI suggestions are now handled in the parent component during file analysis

  // Detect accounting bracket notation in amount column
  const detectAccountingNotation = (): {
    hasBracketNotation: boolean;
    amountColumn?: string;
    sampleBracketValues: string[];
    bracketCount: number;
    totalAmountValues: number;
  } => {
    if (!analysisResult || !config.mappings) {
      return { 
        hasBracketNotation: false, 
        sampleBracketValues: [], 
        bracketCount: 0, 
        totalAmountValues: 0 
      };
    }

    // Find the amount column
    const amountColumn = Object.keys(config.mappings).find(
      header => config.mappings![header] === 'amount'
    );

    if (!amountColumn) {
      return { 
        hasBracketNotation: false, 
        sampleBracketValues: [], 
        bracketCount: 0, 
        totalAmountValues: 0 
      };
    }

    // Check for bracket notation in the amount column
    const bracketValues: string[] = [];
    let totalValues = 0;

    for (const row of analysisResult.previewRows) {
      const value = String(row[amountColumn] || '').trim();
      if (value) {
        totalValues++;
        // Check if value is wrapped in parentheses (accounting notation)
        if (value.match(/^\([0-9,]+\.?[0-9]*\)$/)) {
          bracketValues.push(value);
        }
      }
    }

    return {
      hasBracketNotation: bracketValues.length > 0,
      amountColumn,
      sampleBracketValues: bracketValues.slice(0, 3), // First 3 examples
      bracketCount: bracketValues.length,
      totalAmountValues: totalValues
    };
  };

  const accountingNotation = detectAccountingNotation();

  // Get mapping status for visual indicators
  const getMappingStatus = (): {
    mapped: number;
    total: number;
    hasRequiredFields: boolean;
    requiredFields: string[];
    mappedRequiredFields: string[];
  } => {
    const requiredFields = ['date', 'amount', 'description'];
    
    if (!config.mappings) {
      return { 
        mapped: 0, 
        total: 0, 
        hasRequiredFields: false,
        requiredFields,
        mappedRequiredFields: []
      };
    }
    
    const mappings = config.mappings;
    const mappedFields = Object.values(mappings).filter(mapping => mapping !== 'none');
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mappings).includes(field as any)
    );
    const hasRequiredFields = requiredFields.every(field => 
      Object.values(mappings).includes(field as any)
    );

    return {
      mapped: mappedFields.length,
      total: Object.keys(mappings).length,
      hasRequiredFields,
      requiredFields,
      mappedRequiredFields
    };
  };

  const mappingStatus = getMappingStatus();

  const getColumnMappingIndicator = (header: string) => {
    const mapping = config.mappings?.[header] || 'none';
    const isRequired = ['date', 'amount', 'description'].includes(mapping);
    const isMapped = mapping !== 'none';

    if (isMapped) {
      return (
        <div className={`flex items-center text-xs ${
          isRequired ? 'text-green-700' : 'text-blue-700'
        }`}>
          <CheckCircleIcon className={`h-3 w-3 mr-1 ${
            isRequired ? 'text-green-500' : 'text-blue-500'
          }`} />
          {isRequired ? 'Required ✓' : 'Optional ✓'}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-xs text-gray-500">
          <XCircleIcon className="h-3 w-3 mr-1 text-gray-400" />
          Not mapped
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 ${
        createNewSpreadsheetMode 
          ? 'bg-green-50 border-green-200' 
          : 'bg-purple-50 border-purple-200'
      }`}>
        <div className="flex items-start">
          <InformationCircleIcon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
            createNewSpreadsheetMode ? 'text-green-500' : 'text-purple-500'
          }`} />
          <div className={`text-sm ${
            createNewSpreadsheetMode ? 'text-green-800' : 'text-purple-800'
          }`}>
            <p className="font-medium mb-1">
              {createNewSpreadsheetMode 
                ? 'Create New Spreadsheet with Your Data' 
                : 'Upload CSV Data'
              }
            </p>
            <p>
              {createNewSpreadsheetMode 
                ? 'Upload your transaction data and we\'ll create a personalized Google Spreadsheet with your data already populated!' 
                : 'Import transaction data from CSV files. Data will be processed and categorized automatically.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Last Transaction Info - only show when not in create new spreadsheet mode */}
      {!createNewSpreadsheetMode && (
        lastTransaction ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Latest Transaction in System</p>
                <div className="space-y-1">
                  <p><span className="font-medium">Date:</span> {new Date(lastTransaction.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Description:</span> {lastTransaction.description}</p>
                  <p><span className="font-medium">Amount:</span> ${lastTransaction.amount.toFixed(2)}</p>
                </div>
                <p className="mt-2 text-xs text-blue-600 italic">
                  💡 Upload transactions from {new Date(lastTransaction.date).toLocaleDateString()} onwards to add new data
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">No Transaction Data Found</p>
                <p>This will be your first data import. Upload your complete transaction history or start from a specific date.</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* CSV Upload and Configuration */}
      {csvStep === 'upload' && (
        <CSVUploadArea 
          onFileSelect={onFileSelect} 
          isProcessing={isProcessing}
          processingMessage={feedback?.message || "Processing your file..."}
        />
      )}

      {/* Processing Feedback */}
      {feedback && csvStep === 'upload' && (
        <div className={`p-4 rounded-lg border-l-4 ${
          feedback.type === 'success' ? 'bg-green-50 border-green-400' :
          feedback.type === 'error' ? 'bg-red-50 border-red-400' :
          feedback.type === 'info' ? 'bg-blue-50 border-blue-400' :
          'bg-gray-50 border-gray-400'
        }`}>
          <div className="flex items-center">
            {feedback.type === 'info' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            )}
            <div className={`font-medium ${
              feedback.type === 'success' ? 'text-green-800' :
              feedback.type === 'error' ? 'text-red-800' :
              feedback.type === 'info' ? 'text-blue-800' :
              'text-gray-800'
            }`}>
              {feedback.message}
            </div>
          </div>
        </div>
      )}

      {uploadedFile && csvStep === 'upload' && !isProcessing && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <span className="text-lg mr-2">✅</span>
            <div>
              <div className="font-semibold text-gray-800">File uploaded successfully!</div>
              <div className="text-sm text-gray-600">
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Configuration */}
      {analysisResult && csvStep === 'configure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800">Configure Your Data Import</h4>
          </div>

          {/* Mapping Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{mappingStatus.mapped}</div>
                <div className="text-sm text-gray-600">Columns Mapped</div>
              </div>
            </div>
            <div className={`border rounded-lg p-4 ${
              mappingStatus.hasRequiredFields ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  mappingStatus.hasRequiredFields ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {mappingStatus.mappedRequiredFields.length}/3
                </div>
                <div className={`text-sm ${
                  mappingStatus.hasRequiredFields ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  Required Fields
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{analysisResult.headers.length}</div>
                <div className="text-sm text-blue-600">Total Columns</div>
              </div>
            </div>
          </div>

          {/* Required Fields Status */}
          {!mappingStatus.hasRequiredFields && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Missing Required Mappings</p>
                  <p className="mb-2">Please map these required fields to continue:</p>
                                     <ul className="list-disc list-inside space-y-1">
                     {(['date', 'amount', 'description'] as const).filter(field => 
                       !mappingStatus.mappedRequiredFields.includes(field)
                     ).map(field => (
                       <li key={field} className="capitalize">{field}</li>
                     ))}
                   </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Preview Table */}
          <CSVPreviewTable 
            headers={analysisResult.headers}
            previewRows={analysisResult.previewRows}
          />

          {/* Column Mappings */}
          <div>
            <h5 className="text-md font-medium text-gray-800 mb-3">Map Your Columns</h5>
            <div className="space-y-3">
              {analysisResult.headers.map((header, index) => {
                const currentMapping = config.mappings?.[header] || 'none';
                const isRequired = ['date', 'amount', 'description'].includes(currentMapping);
                const isMapped = currentMapping !== 'none';
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isRequired ? 'border-green-300 bg-green-50' :
                    isMapped ? 'border-blue-300 bg-blue-50' :
                    'border-gray-200 bg-white'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-800 text-sm">{header}</div>
                        {getColumnMappingIndicator(header)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Samples: {analysisResult.previewRows
                          .slice(0, 3)
                          .map(row => String(row[header] || 'N/A'))
                          .join(', ')}
                      </div>
                    </div>
                    <select
                      value={currentMapping}
                      onChange={(e) => onMappingChange(header, e.target.value as any)}
                      className={`ml-4 w-40 px-2 py-1 text-sm border rounded focus:ring-2 focus:border-purple-500 transition-colors ${
                        isRequired ? 'border-green-300 focus:ring-green-500' :
                        isMapped ? 'border-blue-300 focus:ring-blue-500' :
                        'border-gray-300 focus:ring-purple-500'
                      }`}
                    >
                      <option value="none">Not mapped</option>
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="description">Description</option>
                      <option value="description2">Description 2</option>
                      <option value="currency">Currency</option>
                      <option value="direction">Direction</option>
                    </select>
                  </div>
                );
              })}
            </div>
            
            {/* Multiple Description Tip */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <LightBulbIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Multiple Description Fields</p>
                  <p>Map both "Description" and "Description 2" if your bank splits transaction details across columns. They'll be combined automatically.</p>
                </div>
              </div>
            </div>

            {/* Direction Field Tip */}
            {(() => {
              const hasDirectionField = config.mappings && Object.values(config.mappings).includes('direction');
              if (hasDirectionField) {
                return (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start">
                      <LightBulbIcon className="h-4 w-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-indigo-700">
                        <p className="font-medium mb-1">Direction Field Detected</p>
                        <p>This field indicates transaction direction (IN/OUT, DEBIT/CREDIT, etc.). It will be used to automatically determine if amounts should be positive or negative.</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Combined Description Preview */}
            {(() => {
              const descFields = config.mappings ? Object.keys(config.mappings).filter(header => 
                config.mappings![header] === 'description' || config.mappings![header] === 'description2'
              ) : [];
              
              if (descFields.length > 1 && analysisResult.previewRows.length > 0) {
                const sortedDescFields = descFields.sort((a, b) => {
                  const aIsDesc = config.mappings![a] === 'description';
                  const bIsDesc = config.mappings![b] === 'description';
                  return aIsDesc && !bIsDesc ? -1 : !aIsDesc && bIsDesc ? 1 : 0;
                });
                
                const sampleRow = analysisResult.previewRows[0];
                const combinedDesc = sortedDescFields
                  .map(header => String(sampleRow[header] || '').trim())
                  .filter(desc => desc.length > 0)
                  .join(' - ');
                  
                return (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <EyeIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800 text-sm mb-2">Combined Description Preview</p>
                        <div className="space-y-1">
                          {sortedDescFields.map((header, idx) => (
                            <div key={idx} className="text-xs text-green-700">
                              <span className="font-medium">{header}:</span> "{String(sampleRow[header] || '')}"
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t border-green-300">
                            <span className="font-medium text-green-800 text-xs">Result:</span>
                            <div className="mt-1 p-2 bg-white rounded text-xs italic text-green-900">
                              "{combinedDesc}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Accounting Notation Detection */}
            {accountingNotation.hasBracketNotation && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start">
                  <CalculatorIcon className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-800 text-sm mb-2">
                      Accounting Bracket Notation Detected
                    </p>
                    <div className="text-sm text-orange-700 space-y-2">
                      <p>
                        Found {accountingNotation.bracketCount} values with brackets in "{accountingNotation.amountColumn}" 
                        (out of {accountingNotation.totalAmountValues} total values).
                      </p>
                      <div>
                        <p className="font-medium mb-1">Examples found:</p>
                        <div className="space-y-1">
                          {accountingNotation.sampleBracketValues.map((value, idx) => {
                            const parsed = parseAccountingAmount(value);
                            return (
                              <div key={idx} className="flex items-center text-xs">
                                <span className="font-mono bg-orange-100 px-2 py-1 rounded mr-2">{value}</span>
                                <span className="text-orange-600">→</span>
                                <span className="font-mono bg-green-100 px-2 py-1 rounded ml-2 text-green-800">
                                  {parsed !== null ? parsed.toFixed(2) : 'Invalid'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-orange-100 rounded text-xs">
                        <p className="font-medium">✅ Automatic Conversion:</p>
                        <p>Brackets like (100.00) will be converted to negative amounts (-100.00) during import.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Process Button */}
          <button
            onClick={onProcessTransactions}
            disabled={isProcessing || !mappingStatus.hasRequiredFields}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 
             !mappingStatus.hasRequiredFields ? 'Map Required Fields to Continue' :
             'Process Transactions'}
          </button>

          {/* Feedback Messages - moved to underneath the button for better visibility */}
          {feedback && (
            <div className={`p-4 rounded-lg border ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              feedback.type === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {feedback.type === 'success' ? '✅' : 
                     feedback.type === 'error' ? '❌' : 
                     feedback.type === 'processing' ? '🔄' : 
                     'ℹ️'}
                  </span>
                  <div className="font-medium">{feedback.message}</div>
                </div>
                
                {/* Show duplicate report button if duplicates were found */}
                {duplicateReport && duplicateReport.duplicates && duplicateReport.duplicates.length > 0 && 
                 feedback.type === 'success' && feedback.message.includes('duplicate') && (
                  <button
                    onClick={onViewDuplicateReport}
                    className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details ({duplicateReport.duplicates.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadCSVTab; 