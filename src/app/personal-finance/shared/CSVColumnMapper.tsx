import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface DirectionInfo {
  column: string;
  format: 'in_out' | 'debit_credit' | 'positive_negative' | 'unknown';
  mapping: { [key: string]: 'debit' | 'credit' };
  examples: string[];
}

interface AIAnalysisResult {
  suggestions: {
    date?: string;
    amount?: string;
    description?: string;
    direction?: string;
    balance?: string;
    reference?: string;
  };
  confidence: number;
  reasoning: string;
  directionInfo?: DirectionInfo;
  sampleData: any[];
}

interface CSVColumnMapperProps {
  file: File;
  onMappingComplete: (mapping: ColumnMapping, directionInfo?: DirectionInfo) => void;
  onBack: () => void;
}

export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  direction?: string;
  balance?: string;
  reference?: string;
}

const MAPPING_OPTIONS = [
  { value: '', label: 'Select column...' },
  { value: 'date', label: 'Date', description: 'Transaction date/timestamp' },
  { value: 'amount', label: 'Amount', description: 'Transaction amount (positive/negative)' },
  { value: 'description', label: 'Description', description: 'Transaction description/merchant' },
  { value: 'direction', label: 'Direction/Type', description: 'Debit/Credit or In/Out indicator' },
  { value: 'balance', label: 'Balance', description: 'Account balance after transaction' },
  { value: 'reference', label: 'Reference', description: 'Transaction ID or reference' },
  { value: 'none', label: 'Don\'t use', description: 'Skip this column' },
];

export const CSVColumnMapper: React.FC<CSVColumnMapperProps> = ({
  file,
  onMappingComplete,
  onBack,
}) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [header: string]: string }>({});
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);

  useEffect(() => {
    loadFileAndGetSuggestions();
  }, [file]);

  const loadFileAndGetSuggestions = async () => {
    setIsLoadingAI(true);
    setError(null);

    try {
      // Get AI suggestions by sending the file
      const formData = new FormData();
      formData.append('file', file);

      console.log('>>> [Client] Sending request to /api/csv/suggest-mappings');
      console.log('File object:', file);
      console.log('File name:', file.name);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await fetch('/api/csv/suggest-mappings', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`Failed to analyze CSV file: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze CSV');
      }

      setHeaders(result.headers);
      setSampleData(result.sampleData || []);
      setAIAnalysis(result);

      // Apply AI suggestions to mapping
      const suggestedMapping: { [header: string]: string } = {};
      result.headers.forEach((header: string) => {
        // Find if this header was suggested for any field
        const suggestion = Object.entries(result.suggestions).find(([field, suggestedHeader]) => 
          suggestedHeader === header
        );
        
        if (suggestion) {
          suggestedMapping[header] = suggestion[0];
        } else {
          suggestedMapping[header] = 'none';
        }
      });

      setMapping(suggestedMapping);

    } catch (err) {
      console.error('Client error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze CSV');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleMappingChange = (header: string, value: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      
      // If this value is already used by another header, clear it
      if (value !== 'none' && value !== '') {
        Object.keys(newMapping).forEach(key => {
          if (key !== header && newMapping[key] === value) {
            newMapping[key] = 'none';
          }
        });
      }
      
      newMapping[header] = value;
      return newMapping;
    });
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    const requiredFields = ['date', 'amount', 'description'];
    const mappedFields = Object.values(mapping).filter(v => v !== 'none' && v !== '');
    
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field)) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} column is required`);
      }
    });

    return errors;
  };

  const handleSubmit = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      alert('Please fix the following issues:\n' + errors.join('\n'));
      return;
    }

    // Build final mapping
    const finalMapping: ColumnMapping = {
      date: '',
      amount: '',
      description: '',
    };

    Object.entries(mapping).forEach(([header, field]) => {
      if (field === 'date') finalMapping.date = header;
      else if (field === 'amount') finalMapping.amount = header;
      else if (field === 'description') finalMapping.description = header;
      else if (field === 'direction') finalMapping.direction = header;
      else if (field === 'balance') finalMapping.balance = header;
      else if (field === 'reference') finalMapping.reference = header;
    });

    onMappingComplete(finalMapping, aiAnalysis?.directionInfo);
  };

  if (isLoadingAI) {
    return (
      <div className="text-center my-10">
        <div className="border-2 rounded-2xl p-12 bg-white">
          <div className="flex justify-center mb-6">
            <ArrowPathIcon className="h-16 w-16 text-blue-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Analyzing Your CSV File
          </h3>
          <p className="text-gray-600 mb-6">
            Our AI is examining your file structure and suggesting the best column mappings...
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Parsing CSV structure</p>
            <p>✓ Detecting column patterns</p>
            <p>✓ Analyzing data formats</p>
            <p className="text-blue-600">→ Generating smart suggestions</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center my-10">
        <div className="border-2 rounded-2xl p-8 bg-white">
          <div className="flex justify-center mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Analysis Failed
          </h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Another File
            </button>
            <button
              onClick={loadFileAndGetSuggestions}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validationErrors = getValidationErrors();

  return (
    <div className="my-10">
      <div className="border-2 rounded-2xl p-8 bg-white">
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Map Your CSV Columns
        </h3>
        
        {aiAnalysis && (
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">
                  AI Analysis Results (Confidence: {aiAnalysis.confidence}%)
                </h4>
                <p className="text-sm text-blue-700 mb-3">{aiAnalysis.reasoning}</p>
                
                {aiAnalysis.directionInfo && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Direction Column Detected</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Column:</strong> "{aiAnalysis.directionInfo.column}"</p>
                      <p><strong>Format:</strong> {aiAnalysis.directionInfo.format.replace('_', ' ').toUpperCase()}</p>
                      <p><strong>Examples:</strong> {aiAnalysis.directionInfo.examples.join(', ')}</p>
                      <p className="text-xs text-blue-600 mt-2">
                        This will help us determine if transactions are debits or credits.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {headers.map((header) => (
              <div key={header} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-800 mb-1">{header}</h4>
                  {sampleData.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>Sample: {String(sampleData[0]?.[header] || 'N/A').substring(0, 30)}...</p>
                    </div>
                  )}
                </div>
                
                <select
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MAPPING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {mapping[header] && mapping[header] !== 'none' && (
                  <p className="text-xs text-gray-500 mt-2">
                    {MAPPING_OPTIONS.find(opt => opt.value === mapping[header])?.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Required Fields Missing</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sample Data Preview */}
        {sampleData.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Data Preview</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    {headers.map((header) => (
                      <th key={header} className="text-left p-2 font-medium text-gray-700">
                        {header}
                        {mapping[header] && mapping[header] !== 'none' && (
                          <div className="text-blue-600 font-normal">
                            → {mapping[header]}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      {headers.map((header) => (
                        <td key={header} className="p-2 text-gray-600">
                          {String(row[header] || '').substring(0, 30)}
                          {String(row[header] || '').length > 30 && '...'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Upload
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={validationErrors.length > 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              validationErrors.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Continue with Mapping
          </button>
        </div>
      </div>
    </div>
  );
}; 