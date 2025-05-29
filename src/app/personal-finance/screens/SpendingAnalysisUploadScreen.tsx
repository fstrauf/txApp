'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Papa from 'papaparse';
import { CSVUploadArea } from '@/app/personal-finance/shared/CSVUploadArea';
import { AkahuUploadArea } from '@/app/personal-finance/shared/AkahuUploadArea';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { 
  ChartBarIcon, 
  BuildingLibraryIcon, 
  DocumentTextIcon, 
  LightBulbIcon, 
  EyeIcon, 
  ArrowTrendingUpIcon, 
  FlagIcon 
} from '@heroicons/react/24/outline';

type UploadMethod = 'csv' | 'akahu';

// Define the types a column can be mapped to
type MappedFieldType = 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'none';

interface AnalysisResult {
  headers: string[];
  previewRows: Record<string, any>[];
  detectedDelimiter: string;
}

interface ImportConfig {
  mappings: Record<string, MappedFieldType>;
  dateFormat: string;
  amountFormat: 'standard' | 'negate' | 'sign_column';
  signColumn?: string;
  skipRows: number;
  delimiter?: string;
}

// Define common date formats compatible with date-fns
const commonDateFormats = [
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS (e.g., 2023-12-31 14:30:00)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (e.g., 2023-12-31)' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (e.g., 12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (e.g., 31/12/2023)' },
  { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (e.g., 31.12.2023)' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD (e.g., 2023/12/31)' },
];

const SpendingAnalysisUploadScreen: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();
  const { goToScreen } = useScreenNavigation();
  const { userData, processTransactionData } = usePersonalFinanceStore();
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('csv');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importedTransactions, setImportedTransactions] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<Partial<ImportConfig>>({
    mappings: {},
    dateFormat: commonDateFormats[1].value, // Default to yyyy-MM-dd
    amountFormat: 'standard',
    skipRows: 0,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'ready'>('upload');

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setImportedTransactions(null);
    setFeedback(null);
    setCurrentStep('upload');
    
    // Automatically analyze the file
    await handleAnalyze(file);
  };

  const handleAnalyze = async (selectedFile: File) => {
    console.log("handleAnalyze called");
    
    if (!selectedFile) {
      console.error('Analysis stopped: No file selected.'); 
      setFeedback({ type: 'error', message: 'Please select a file first.'});
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log("Sending request to /api/transactions/analyze");
      const response = await fetch('/api/transactions/analyze', { 
        method: 'POST',
        body: formData,
      });
      console.log("Analyze Response Status:", response.status);

      const result = await response.json();
      console.log("Analyze Response Body:", result);

      if (!response.ok) {
        throw new Error(result.error || `Analysis failed with status ${response.status}`);
      }

      setAnalysisResult(result);
      
      // Initialize mappings: Set all columns to 'none' initially
      let initialMappings = result.headers.reduce((acc: Record<string, MappedFieldType>, header: string) => {
        acc[header] = 'none';
        // Simple auto-detection based on common keywords
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('date') || lowerHeader.includes('created')) {
          acc[header] = 'date';
        } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('source amount')) {
          acc[header] = 'amount';
        } else if (lowerHeader.includes('desc') || lowerHeader.includes('payee') || lowerHeader.includes('memo') || lowerHeader.includes('target name') || lowerHeader.includes('reference') || lowerHeader.includes('details') || lowerHeader.includes('particulars')) {
          // For ANZ-style banks, map the first description field to 'description' and subsequent ones to 'description2'
          const hasDescriptionMapped = Object.values(acc).includes('description');
          acc[header] = hasDescriptionMapped ? 'description2' : 'description';
        } else if (lowerHeader.includes('currency')) {
          acc[header] = 'currency';
        }
        return acc;
      }, {});

      // Enforce uniqueness for all auto-detected fields
      const uniqueAutoAssignFields: MappedFieldType[] = ['date', 'amount', 'currency', 'description', 'description2'];
      uniqueAutoAssignFields.forEach(fieldType => {
        let foundFirst = false;
        Object.keys(initialMappings).forEach(header => {
          if (initialMappings[header] === fieldType) {
            if (foundFirst) {
              initialMappings[header] = 'none'; // Reset subsequent matches
            } else {
              foundFirst = true; // Keep the first match
            }
          }
        });
      });

      // Auto-detect date format from preview
      let detectedDateFormat = commonDateFormats[1].value; // Default to yyyy-MM-dd
      const dateHeader = Object.keys(initialMappings).find(h => initialMappings[h] === 'date');
      if (dateHeader && result.previewRows.length > 0) {
        const firstDateValue = String(result.previewRows[0][dateHeader] || '');
        // Check for formats in our common list
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[0].value; // yyyy-MM-dd HH:mm:ss
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[1].value; // yyyy-MM-dd
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[2].value; // MM/dd/yyyy
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[3].value; // dd/MM/yyyy
        } else if (/^\d{2}\.\d{2}\.\d{4}/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[4].value; // dd.MM.yyyy
        } else if (/^\d{4}\/\d{2}\/\d{2}/.test(firstDateValue)) {
          detectedDateFormat = commonDateFormats[5].value; // yyyy/MM/dd
        }
      }

      setConfig(prev => ({
        ...prev, 
        mappings: initialMappings, 
        delimiter: result.detectedDelimiter || prev.delimiter, 
        dateFormat: detectedDateFormat
      }));

      setCurrentStep('configure');
      setFeedback({ type: 'success', message: 'File analyzed successfully! Please configure the column mappings below.' });

    } catch (error: any) {
      console.error("Error during analysis fetch:", error);
      setFeedback({ type: 'error', message: `Analysis Error: ${error.message}` });
      setAnalysisResult(null); 
    } finally {
      console.log("handleAnalyze finished");
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (csvHeader: string, fieldType: MappedFieldType) => {
    setConfig(prevConfig => {
      const newMappings = { ...prevConfig.mappings };

      // If assigning a unique field, ensure it's unique across all columns
      // All fields should be unique - description and description2 can coexist but each should only appear once
      const uniqueFields: MappedFieldType[] = ['date', 'amount', 'currency', 'description', 'description2'];
      if (uniqueFields.includes(fieldType)) {
        // Find if any other header is currently mapped to this fieldType
        const currentHeaderForField = Object.keys(newMappings).find(
          header => newMappings[header] === fieldType
        );
        // If another header has this mapping, set it back to 'none'
        if (currentHeaderForField && currentHeaderForField !== csvHeader) {
          newMappings[currentHeaderForField] = 'none';
        }
      }
      
      // Update the mapping for the current header
      newMappings[csvHeader] = fieldType;
      
      return { ...prevConfig, mappings: newMappings };
    });
  };

  const handleConfigChange = (field: keyof Omit<ImportConfig, 'mappings'>, value: string | number) => {
    setConfig(prev => {
      const updatedConfig = { ...prev, mappings: { ...prev.mappings } };
      if (field === 'skipRows') {
        updatedConfig[field] = Number(value);
      } else {
        updatedConfig[field as keyof Omit<ImportConfig, 'mappings' | 'skipRows'>] = String(value) as any;
      }
      if (field === 'amountFormat' && value !== 'sign_column') {
        updatedConfig.signColumn = undefined;
      }
      return updatedConfig;
    });
  };

  const handleTransactionsSelect = (transactions: any[]) => {
    setImportedTransactions(transactions);
    setUploadedFile(null); // Clear any CSV file
    
    // Process transaction data and update the store
    processTransactionData(transactions);
  };

  const validateAndProcessData = async () => {
    if (!analysisResult || !config.mappings || !uploadedFile) {
      setFeedback({ type: 'error', message: 'No data to process. Please upload and configure a file first.' });
      return;
    }

    // Validation
    const requiredFields = ['date', 'amount', 'description'];
    const mappingValues = Object.values(config.mappings);
    const missingFields = requiredFields.filter(field => !mappingValues.includes(field as MappedFieldType));

    if (missingFields.length > 0) {
      setFeedback({ type: 'error', message: `Please map the following required fields: ${missingFields.join(', ')}` });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('ready');
    
    try {
      // Parse the full CSV file for processing (not just preview)
      const fileText = await uploadedFile.text();
      let fullData: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        Papa.parse(fileText, {
          header: true,
          skipEmptyLines: true,
          delimiter: config.delimiter || ',',
          dynamicTyping: true,
          transformHeader: (header: string) => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("CSV Parsing Errors:", results.errors);
              reject(new Error('Failed to parse CSV file'));
              return;
            }
            fullData = results.data as any[];
            resolve();
          },
          error: (error: Error) => {
            console.error('Critical CSV parsing error:', error);
            reject(error);
          }
        });
      });

      console.log('Full CSV data loaded:', {
        totalRows: fullData.length,
        sampleRow: fullData[0]
      });

      // Process the data with concatenated descriptions
      const processedData = fullData.map(row => {
        const processedRow = { ...row };
        
        // Concatenate description fields if both are mapped
        if (config.mappings) {
          const descriptionFields = Object.keys(config.mappings).filter(header => 
            config.mappings![header] === 'description' || config.mappings![header] === 'description2'
          );
          
          if (descriptionFields.length > 1) {
            // Sort to ensure consistent order (description before description2)
            const sortedDescFields = descriptionFields.sort((a, b) => {
              const aIsDesc = config.mappings![a] === 'description';
              const bIsDesc = config.mappings![b] === 'description';
              return aIsDesc && !bIsDesc ? -1 : !aIsDesc && bIsDesc ? 1 : 0;
            });
            
            const concatenatedDescription = sortedDescFields
              .map(header => String(row[header] || '').trim())
              .filter(desc => desc.length > 0)
              .join(' - ');
              
            // Update the row with concatenated description
            const mainDescHeader = sortedDescFields.find(h => config.mappings![h] === 'description');
            if (mainDescHeader) {
              processedRow[mainDescHeader] = concatenatedDescription;
            }
          }
        }
        
        return processedRow;
      });

      // Transform processed data to format expected by categorization API
      const transactions = processedData.map(row => {
        const dateHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'date');
        const amountHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'amount');
        const descriptionHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'description');
        
        const amount = parseFloat(String(row[amountHeader!] || '0'));
        const description = String(row[descriptionHeader!] || '');
        
        return {
          description: description,
          money_in: amount > 0, // Positive amounts are income
          amount: Math.abs(amount), // API expects positive amounts
          date: row[dateHeader!] // Include date for potential future use
        };
      });

      console.log('Data transformation for categorization:', {
        originalDataCount: fullData.length,
        processedDataCount: processedData.length,
        transactionCount: transactions.length,
        sampleTransactions: transactions.slice(0, 3),
        allAmounts: transactions.slice(0, 10).map((t: any) => t.amount)
      });

      setFeedback({ type: 'success', message: `Sending ${transactions.length} transactions for categorization...` });

      // Send to categorization service
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Categorization failed with status ${response.status}`);
      }

      const categorizedData = await response.json();
      
      // Store the categorized results in the personal finance store
      if (categorizedData.results) {
        console.log('Processing categorization results:', {
          originalDataCount: processedData.length,
          categorizedResultsCount: categorizedData.results.length,
          sampleOriginalData: processedData.slice(0, 2),
          sampleCategorizedData: categorizedData.results.slice(0, 2)
        });

        // Combine original transaction data with categorization results
        const enrichedTransactions = categorizedData.results.map((result: any, index: number) => {
          const originalRow = processedData[index];
          const dateHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'date');
          const amountHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'amount');
          
          const originalAmount = parseFloat(String(originalRow?.[amountHeader!] || '0'));
          
          return {
            id: `transaction-${index}`,
            date: originalRow?.[dateHeader!] || new Date().toISOString().split('T')[0],
            description: result.cleaned_narrative || result.description || 'Unknown',
            amount: Math.abs(originalAmount),
            category: result.predicted_category || 'Uncategorized',
            account: 'Uploaded CSV',
            isDebit: originalAmount < 0, // Negative amounts are debits (expenses)
            // Additional categorization metadata
            predicted_category: result.predicted_category,
            similarity_score: result.similarity_score,
            money_in: result.money_in
          };
        });

        console.log('Created enriched transactions:', {
          count: enrichedTransactions.length,
          sampleTransactions: enrichedTransactions.slice(0, 2),
          debitCount: enrichedTransactions.filter((t: any) => t.isDebit).length,
          totalAmount: enrichedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
        });

        // Process the enriched transaction data
        processTransactionData(enrichedTransactions);
        
        setFeedback({ 
          type: 'success', 
          message: `Successfully categorized ${categorizedData.results.length} transactions! Found ${enrichedTransactions.filter((t: any) => t.isDebit).length} expense transactions.` 
        });
      }
      
      // Navigate to results screen
      goToScreen('spendingAnalysisResults');
    } catch (error: any) {
      console.error('Categorization error:', error);
      setFeedback({ type: 'error', message: `Processing error: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasData = uploadedFile || (importedTransactions && importedTransactions.length > 0);

  const handleSkip = () => {
    goToScreen('initialInsights');
  };

  function prevScreen(): void {
    goToScreen('initialInsights');
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">Deep Dive: Spending Analysis</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Upload Your Bank Transactions
          </h1>
          <p className="text-lg text-gray-600">
            Get detailed insights into your spending patterns and discover opportunities to save
          </p>
          
          {/* Quick Navigation to Spending Analysis if data exists */}
          {userData.transactions && userData.transactions.length > 0 && userData.categorySpending && (
            <div className="mt-6">
              <PrimaryButton
                onClick={() => goToScreen('spendingAnalysisResults')}
                variant="secondary"
                className="text-sm px-6 py-2"
              >
                <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> View Your Spending Analysis →
              </PrimaryButton>
              <p className="text-xs text-gray-500 mt-2">
                You have {userData.transactions.length} transactions analyzed
              </p>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'upload' ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white'
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'upload' ? 'text-indigo-600' : 'text-indigo-600'
              }`}>Upload File</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'configure' || currentStep === 'ready' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'configure' ? 'bg-indigo-500 text-white' : 
                currentStep === 'ready' ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'configure' ? 'text-indigo-600' : 
                currentStep === 'ready' ? 'text-indigo-600' : 'text-gray-500'
              }`}>Configure</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'ready' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'ready' ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'ready' ? 'text-indigo-600' : 'text-gray-500'
              }`}>Analyze</span>
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Choose your preferred method:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              // onClick={() => setUploadMethod('akahu')}
              className={`p-6 rounded-xl border-2 transition-all relative ${
                uploadMethod === 'akahu'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 opacity-75'
              }`}
              disabled
            >
              {/* Coming Soon Badge */}
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Coming Soon
              </div>
              
              <div className="flex justify-center mb-3">
                <BuildingLibraryIcon className="h-12 w-12 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Connect Bank Account</h4>
              <p className="text-sm text-gray-600">
                Automatically import transactions securely via Akahu
              </p>
              <div className="mt-3 text-xs text-gray-500 font-medium">
                ✓ Recommended • Most accurate
              </div>
            </button>

            <button
              onClick={() => setUploadMethod('csv')}
              className={`p-6 rounded-xl border-2 transition-all ${
                uploadMethod === 'csv'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-3">
                <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Upload CSV File</h4>
              <p className="text-sm text-gray-600">
                Export transactions from your online banking
              </p>
              <div className="mt-3 text-xs text-gray-500">
                Manual export required
              </div>
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          {uploadMethod === 'csv' ? (
            <CSVUploadArea onFileSelect={handleFileSelect} />
          ) : (
            <AkahuUploadArea onTransactionsSelect={handleTransactionsSelect} />
          )}
          
          {uploadedFile && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
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

          {importedTransactions && importedTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                <div>
                  <div className="font-semibold text-gray-800">Transactions imported successfully!</div>
                  <div className="text-sm text-gray-600">
                    {importedTransactions.length} transactions ready for analysis
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`mb-8 p-4 rounded-xl border ${
            feedback.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">{feedback.type === 'success' ? '✅' : '❌'}</span>
              <div className="font-medium">{feedback.message}</div>
            </div>
          </div>
        )}

        {/* Configuration Section - Only show when file is analyzed */}
        {analysisResult && currentStep === 'configure' && (
          <div className="bg-white rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Configure Your Data Import
            </h3>
            
            {/* Preview Table */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Preview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {analysisResult.headers.map((header, index) => (
                        <th key={index} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.previewRows.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {analysisResult.headers.map((header, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-sm text-gray-600 border-b">
                            {String(row[header] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column Mappings */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Map Your Columns</h4>
              <div className="grid grid-cols-1 gap-4">
                {analysisResult.headers.map((header, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{header}</div>
                      <div className="text-sm text-gray-600">
                        Sample: {String(analysisResult.previewRows[0]?.[header] || 'N/A')}
                      </div>
                    </div>
                    <select
                      value={config.mappings?.[header] || 'none'}
                      onChange={(e) => handleMappingChange(header, e.target.value as MappedFieldType)}
                      className="ml-4 w-38 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              
              {/* Tip box for multiple description fields */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <LightBulbIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <div>
                    <h5 className="font-semibold text-blue-800 mb-1">Multiple Description Fields</h5>
                    <p className="text-sm text-blue-700">
                      Some banks (like ANZ) split transaction details across multiple columns. 
                      You can map both "Description" and "Description 2" - they'll be automatically 
                      combined with a " - " separator to create complete transaction descriptions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview for combined descriptions */}
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
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <EyeIcon className="h-5 w-5 text-gray-600 mr-2" />
                        <div className="flex-1">
                          <h5 className="font-semibold text-green-800 mb-2">Combined Description Preview</h5>
                          <div className="space-y-2">
                            {sortedDescFields.map((header, idx) => (
                              <div key={idx} className="text-sm text-green-700">
                                <span className="font-medium">{header}:</span> "{String(sampleRow[header] || '')}"
                              </div>
                            ))}
                            <div className="pt-2 border-t border-green-300">
                              <span className="font-medium text-green-800">Combined Result:</span>
                              <div className="mt-1 p-2 bg-white rounded border italic text-green-900">
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

            {/* Date Format Configuration */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Date Format</h4>
              <select
                value={config.dateFormat || commonDateFormats[1].value}
                onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {commonDateFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Format Configuration */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Amount Format</h4>
              <select
                value={config.amountFormat || 'standard'}
                onChange={(e) => handleConfigChange('amountFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="standard">Standard (positive for income, negative for expenses)</option>
                <option value="negate">Negate values (flip positive/negative)</option>
                <option value="sign_column">Use separate sign column</option>
              </select>
              
              {config.amountFormat === 'sign_column' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sign Column</label>
                  <select
                    value={config.signColumn || ''}
                    onChange={(e) => handleConfigChange('signColumn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select sign column...</option>
                    {analysisResult.headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Skip Rows Configuration */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Skip Rows</h4>
              <input
                type="number"
                min="0"
                value={config.skipRows || 0}
                onChange={(e) => handleConfigChange('skipRows', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Number of rows to skip from the top"
              />
              <p className="mt-1 text-sm text-gray-600">Skip header rows or metadata at the top of your file</p>
            </div>
          </div>
        )}

        {/* What We'll Analyze */}
        {currentStep === 'upload' && (
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            What we'll analyze for you:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <ChartBarIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-800">Spending Categories</h4>
                <p className="text-sm text-gray-600">Automatically categorize all your transactions into groceries, dining, transport, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <ArrowTrendingUpIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-800">Spending Trends</h4>
                <p className="text-sm text-gray-600">See how your spending changes over time and identify patterns.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-800">Saving Opportunities</h4>
                <p className="text-sm text-gray-600">Find specific areas where you could reduce spending.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FlagIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h4 className="font-semibold text-gray-800">Benchmarking</h4>
                <p className="text-sm text-gray-600">Compare your spending to others in similar situations.</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* How to Export - Only show for CSV method and upload step */}
        {uploadMethod === 'csv' && currentStep === 'upload' && (
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              How to export from your bank:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">ANZ</h4>
                <p className="text-sm text-gray-600">Internet Banking → Accounts → Export → CSV</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">ASB</h4>
                <p className="text-sm text-gray-600">FastNet Classic → Account Activity → Export</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Westpac</h4>
                <p className="text-sm text-gray-600">Online Banking → Statements → Download CSV</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">BNZ</h4>
                <p className="text-sm text-gray-600">Internet Banking → Accounts → Export → CSV</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PrimaryButton
            variant="secondary"
            onClick={handleSkip}
            className="sm:w-auto"
          >
            Skip for Now
          </PrimaryButton>
          
          {currentStep === 'configure' && (
            <PrimaryButton
              onClick={validateAndProcessData}
              disabled={isProcessing}
              className="sm:flex-1"
            >
              {isProcessing ? 'Processing...' : 'Analyze My Spending →'}
            </PrimaryButton>
          )}
          
          {currentStep === 'upload' && (
            <PrimaryButton
              onClick={() => {}}
              disabled={true}
              className="sm:flex-1"
            >
              Upload File to Continue
            </PrimaryButton>
          )}
        </div>

        {/* Navigation Buttons - Consistent at Bottom */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
          <PrimaryButton
            onClick={prevScreen}
            variant="secondary"
            className="w-full sm:w-48 order-1 sm:order-1"
          >
            Back
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalysisUploadScreen;
