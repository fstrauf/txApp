'use client';

import React from 'react';
import { CSVUploadArea } from '../../shared/CSVUploadArea';
import CSVPreviewTable from './CSVPreviewTable';
import { 
  InformationCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export interface AnalysisResult {
  headers: string[];
  previewRows: Record<string, any>[];
  detectedDelimiter: string;
}

export interface ImportConfig {
  mappings: Record<string, 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'none'>;
  dateFormat: string;
  amountFormat: 'standard' | 'negate' | 'sign_column';
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
  onFileSelect: (file: File) => void;
  onMappingChange: (csvHeader: string, fieldType: 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'none') => void;
  onProcessTransactions: () => void;
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
  onFileSelect,
  onMappingChange,
  onProcessTransactions
}) => {
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
        <CSVUploadArea onFileSelect={onFileSelect} />
      )}

      {uploadedFile && csvStep === 'upload' && (
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
          <h4 className="text-lg font-semibold text-gray-800">Configure Your Data Import</h4>
          
          {/* Preview Table */}
          <CSVPreviewTable 
            headers={analysisResult.headers}
            previewRows={analysisResult.previewRows}
          />

          {/* Column Mappings */}
          <div>
            <h5 className="text-md font-medium text-gray-800 mb-3">Map Your Columns</h5>
            <div className="space-y-3">
              {analysisResult.headers.map((header, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{header}</div>
                    <div className="text-xs text-gray-600">
                      Samples: {analysisResult.previewRows
                        .slice(0, 3)
                        .map(row => String(row[header] || 'N/A'))
                        .join(', ')}
                    </div>
                  </div>
                  <select
                    value={config.mappings?.[header] || 'none'}
                    onChange={(e) => onMappingChange(header, e.target.value as any)}
                    className="ml-4 w-36 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="none">Not mapped</option>
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="description">Description</option>
                    <option value="description2">Description 2</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>
              ))}
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
          </div>

          {/* Process Button */}
          <button
            onClick={onProcessTransactions}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Process Transactions'}
          </button>

          {/* Feedback Messages - moved to underneath the button for better visibility */}
          {feedback && (
            <div className={`p-4 rounded-lg border ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              feedback.type === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {feedback.type === 'success' ? '✅' : 
                   feedback.type === 'error' ? '❌' : 
                   feedback.type === 'processing' ? '🔄' : 
                   'ℹ️'}
                </span>
                <div className="font-medium">{feedback.message}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadCSVTab; 