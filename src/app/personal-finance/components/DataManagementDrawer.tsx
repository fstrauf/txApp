'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { parseTransactionDate } from '@/lib/utils';
import { parse, isValid, format } from 'date-fns';
import Papa from 'papaparse';
import { 
  XMarkIcon, 
  CloudArrowUpIcon,
  TableCellsIcon,
  ArrowPathIcon,
  CheckIcon,
  CogIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { convertCurrency, extractCurrencyCode } from '@/lib/currency';
import { ensureApiAccessForTraining } from '@/lib/apiKeyUtils';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { validateClassifyRequest, validateCsvMappingData, handleClassifyError } from '@/lib/classify-validation';
import { CSVMappingGuide } from './CSVMappingGuide';

// Import modular components
import ManageDataTab from './data-management/ManageDataTab';
import UploadCSVTab, { AnalysisResult, ImportConfig } from './data-management/UploadCSVTab';
import ValidateTransactionsTab, { ValidationTransaction } from './data-management/ValidateTransactionsTab';
import SettingsTab from './data-management/SettingsTab';

interface DataManagementDrawerProps {
  spreadsheetLinked: boolean;
  spreadsheetUrl: string | null;
  onSpreadsheetLinked: (data: { spreadsheetId: string; spreadsheetUrl: string }) => void;
  onTransactionsFromGoogleSheets: (transactions: any[]) => void;
  onRefreshData: () => void;
  isLoading: boolean;
  onClose: () => void;
  error?: string | null;
  onClearError?: () => void;
  defaultTab?: TabType;
  spreadsheetData?: { spreadsheetName?: string };
}

type TabType = 'manage' | 'upload' | 'validate' | 'settings';

// Define common date formats compatible with date-fns
const commonDateFormats = [
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS (e.g., 2023-12-31 14:30:00)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (e.g., 2023-12-31)' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (e.g., 12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (e.g., 31/12/2023)' },
  { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (e.g., 31.12.2023)' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD (e.g., 2023/12/31)' },
];

const DataManagementDrawer: React.FC<DataManagementDrawerProps> = ({
  spreadsheetLinked,
  spreadsheetUrl,
  onSpreadsheetLinked,
  onTransactionsFromGoogleSheets,
  onRefreshData,
  isLoading,
  onClose,
  error,
  onClearError,
  defaultTab = 'manage',
  spreadsheetData
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userData, processTransactionData, updateBaseCurrency } = usePersonalFinanceStore();
  const { requestSpreadsheetAccess } = useIncrementalAuth();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  

  
  // CSV Processing State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<Partial<ImportConfig>>({
    mappings: {},
    dateFormat: commonDateFormats[1].value, // Default to yyyy-MM-dd
    amountFormat: 'standard',
    skipRows: 0,
  });
  const [csvStep, setCsvStep] = useState<'upload' | 'configure' | 'ready'>('upload');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'processing'; message: string } | null>(null);

  // Validation state
  const [validationTransactions, setValidationTransactions] = useState<ValidationTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showOnlyUnvalidated, setShowOnlyUnvalidated] = useState(false);
  const [createNewSpreadsheetMode, setCreateNewSpreadsheetMode] = useState(false);
  const [isValidatingAllRemaining, setIsValidatingAllRemaining] = useState(false);
  
  // Currency selection for new spreadsheet
  const [newSpreadsheetCurrency, setNewSpreadsheetCurrency] = useState<string>('');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  
  // CSV mapping guide
  const [showMappingGuide, setShowMappingGuide] = useState(false);
  
  // Duplicate detection reporting
  const [duplicateReport, setDuplicateReport] = useState<any>(null);
  const [showDuplicateReport, setShowDuplicateReport] = useState(false);
  
  // Get base currency from store with fallback
  const baseCurrency = userData.baseCurrency || 'USD';

  // Helper functions
  const getLastTransaction = () => {
    if (!userData.transactions || userData.transactions.length === 0) return null;
    
    const sortedTransactions = [...userData.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sortedTransactions[0];
  };

  const createTransactionKey = (transaction: any) => {
    // Create a unique key based on date, amount, and description
    const date = new Date(transaction.date).toISOString().split('T')[0];
    const amount = Math.abs(transaction.amount).toFixed(2);
    const description = transaction.description.toLowerCase().trim().substring(0, 50);
    return `${date}-${amount}-${description}`;
  };

  // Enhanced duplicate detection with multiple strategies
  const createTransactionFingerprint = (transaction: any, strategy: 'strict' | 'moderate' | 'loose' = 'moderate') => {
    const date = new Date(transaction.date).toISOString().split('T')[0];
    const amount = Math.abs(transaction.amount).toFixed(2);
    const description = transaction.description.toLowerCase().trim();
    const isDebit = transaction.isDebit || transaction.money_in === false;
    
    switch (strategy) {
      case 'strict':
        // Most precise - includes direction, full description, and account
        return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description}-${transaction.account || 'unknown'}`;
      
      case 'moderate':
        // Balanced approach - includes direction and truncated description
        return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description.substring(0, 100)}`;
      
      case 'loose':
        // Most forgiving - similar to original but with direction
        return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description.substring(0, 50)}`;
      
      default:
        return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description.substring(0, 100)}`;
    }
  };

  // Enhanced duplicate detection with detailed reporting
  const detectDuplicateTransactions = (newTransactions: any[], strategy: 'strict' | 'moderate' | 'loose' = 'moderate') => {
    if (!userData.transactions || userData.transactions.length === 0) {
      return {
        uniqueTransactions: newTransactions,
        duplicates: [],
        duplicateCount: 0,
        strategy
      };
    }

    // Create fingerprints for existing transactions
    const existingFingerprints = new Map();
    userData.transactions.forEach(tx => {
      const fingerprint = createTransactionFingerprint(tx, strategy);
      if (!existingFingerprints.has(fingerprint)) {
        existingFingerprints.set(fingerprint, []);
      }
      existingFingerprints.get(fingerprint).push(tx);
    });

    // Also check for duplicates within the new batch
    const newFingerprints = new Map();
    const duplicates: any[] = [];
    const uniqueTransactions: any[] = [];

    newTransactions.forEach((transaction, index) => {
      const fingerprint = createTransactionFingerprint(transaction, strategy);
      
      // Check against existing transactions
      const existingMatches = existingFingerprints.get(fingerprint);
      
      // Check against other new transactions
      const newMatches = newFingerprints.get(fingerprint);
      
      if (existingMatches || newMatches) {
        duplicates.push({
          transaction,
          index,
          fingerprint,
          existingMatches: existingMatches || [],
          newMatches: newMatches || [],
          reason: existingMatches ? 'existing' : 'within_batch'
        });
      } else {
        uniqueTransactions.push(transaction);
        if (!newFingerprints.has(fingerprint)) {
          newFingerprints.set(fingerprint, []);
        }
        newFingerprints.get(fingerprint).push(transaction);
      }
    });

    return {
      uniqueTransactions,
      duplicates,
      duplicateCount: duplicates.length,
      strategy,
      stats: {
        total: newTransactions.length,
        unique: uniqueTransactions.length,
        duplicateWithExisting: duplicates.filter(d => d.reason === 'existing').length,
        duplicateWithinBatch: duplicates.filter(d => d.reason === 'within_batch').length
      }
    };
  };

  const filterDuplicateTransactions = (newTransactions: any[]) => {
    if (!userData.transactions || userData.transactions.length === 0) {
      return newTransactions; // No existing data, all transactions are new
    }

    // Create a set of existing transaction keys (keeping backward compatibility)
    const existingKeys = new Set(
      userData.transactions.map(t => createTransactionKey(t))
    );

    // Filter out duplicates
    const uniqueTransactions = newTransactions.filter(t => {
      const key = createTransactionKey(t);
      return !existingKeys.has(key);
    });

    return uniqueTransactions;
  };

  const lastTransaction = getLastTransaction();

  // Load base currency from spreadsheet on component mount
  useEffect(() => {
    if (userData.spreadsheetId && activeTab === 'settings') {
      // Base currency loading is handled in the SettingsTab component
    }
  }, [userData.spreadsheetId, activeTab]);



  // Handle survey responses
  const handleSurveyComplete = (surveyId: string, responses: string[]) => {
    console.log('Survey completed:', surveyId, responses);
    // Additional tracking or actions can be added here
  };

  // Polling for completion similar to LunchMoney
  const pollForCompletion = async (
    predictionId: string,
    operationType: 'training' | 'classification' | 'auto_classification',
    onSuccess: (results?: any) => void,
    onError: (message: string) => void
  ) => {
    const maxPolls = 120; // 120 * 5s = 10 minutes
    const pollInterval = 5000;
    let pollCount = 0;

    const executePoll = async () => {
      while (pollCount < maxPolls) {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Use correct URL format with query parameters
        const pollingUrl = `/api/classify/status?job_id=${predictionId}&type=${operationType}`;
        console.log(`[Poll] Attempting fetch (${pollCount}/${maxPolls}): ${pollingUrl}`);

        try {
          const response = await fetch(pollingUrl);
          console.log(`[Poll] Response Status: ${response.status}`);

          const responseText = await response.text();
          console.log(`[Poll] Response Text:`, responseText.substring(0, 200));

          if (!response.ok) {
            // If the status endpoint itself fails (e.g., 500, 404 for the ID),
            // we might want to retry a few times or fail fast.
            // For now, we'll treat non-200 as a polling error after first attempt.
            if (pollCount > 3) { // Allow a few retries for transient network issues with the status endpoint
               throw new Error(`Status endpoint error: ${response.status} ${response.statusText}`);
            } else {
                console.warn(`[Poll] Status endpoint non-OK response for ${predictionId} (attempt ${pollCount}): ${response.status}. Retrying...`);
                // Continue to the next poll iteration
                setFeedback({ 
                  type: 'info', 
                  message: `🔄 ${operationType} status check (attempt ${pollCount})...` 
                });
                continue;
            }
          }

          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`[Poll] Job status:`, data);

            if (data.status === 'completed') {
              console.log(`[Poll] Job completed. Data:`, data);
              setFeedback({ type: 'success', message: `${operationType} completed successfully!` });
              
              if (onSuccess) {
                // When polling is complete, the results are nested
                // We need to pass the actual results object to the success handler
                const finalResults = data.results || (data.fullPredictionStatus ? data.fullPredictionStatus.results : null);
                
                if (!finalResults) {
                  throw new Error('Polling completed, but no results found in response.');
                }
                
                // Pass the full data structure required by the handler
                const finalData = {
                  categorized_transactions: finalResults,
                  base_currency: data.fullPredictionStatus?.processing_info?.base_currency,
                  categories_used: data.fullPredictionStatus?.processing_info?.categories_used,
                  duplicate_report: data.fullPredictionStatus?.duplicate_report
                };

                await onSuccess(finalData);
              }
              return;
            } else if (data.status === 'failed') {
              const errorMessage = data.error || 'Job failed';
              console.error(`[Poll] Job failed:`, errorMessage);
              setFeedback({ type: 'error', message: `${operationType} failed: ${errorMessage}` });
              if (onError) {
                onError(errorMessage);
              }
              return;
            } else if (data.status === 'error') {
              // Handle explicit error status from API
              const errorMessage = data.error || data.message || 'Job encountered an error';
              console.error(`[Poll] Job error:`, errorMessage);
              setFeedback({ type: 'error', message: `${operationType} error: ${errorMessage}` });
              if (onError) {
                onError(errorMessage);
              }
              return;
            } else {
              setFeedback({ 
                type: 'info', 
                message: `🔄 ${operationType} in progress - processing your request (poll ${pollCount}/${maxPolls})...` 
              });
            }
          } catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse response';
            console.error(`[Poll] Failed to parse JSON response:`, errorMessage);
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error(`[Poll] Error polling for ${predictionId} (attempt ${pollCount}):`, error);
          if (pollCount >= maxPolls / 2) {
            onError(error instanceof Error ? error.message : `Failed to poll for job ${predictionId} status.`);
            return;
          }
          setFeedback({ 
            type: 'info', 
            message: `🔄 ${operationType} - connection issue (attempt ${pollCount}), retrying...` 
          });
        }
      }
      // If loop finishes, it means timeout
      onError(`${operationType} job ${predictionId} timed out after ${maxPolls} polling attempts.`);
    };
    
    // Await polling to complete - this ensures the function only resolves when polling finishes
    await executePoll();
  };

  // Separate function to handle auto-classification results
  const handleAutoClassificationComplete = async (autoClassifiedData: any, uniqueTransactions: any[], isCreateNewMode: boolean) => {
    try {
      if (!autoClassifiedData || !autoClassifiedData.categorized_transactions) {
        throw new Error("Invalid auto-classification data received.");
      }

      const categorized = autoClassifiedData.categorized_transactions;
      
      const newBaseCurrency = autoClassifiedData.base_currency || baseCurrency;
      if (newBaseCurrency !== baseCurrency) {
        updateBaseCurrency(newBaseCurrency);
      }

      if (categorized.length !== uniqueTransactions.length) {
        console.error('Mismatched transaction counts between original and categorized data.', {
          categorized: categorized.length,
          unique: uniqueTransactions.length
        });
        throw new Error('Mismatched transaction counts after classification.');
      }

      const validated: ValidationTransaction[] = categorized.map((t: any, index: number) => {
        const originalTx = uniqueTransactions[index];
        
        if (!originalTx) {
          // This should not happen if lengths are checked, but as a safeguard:
          console.warn(`Could not find original transaction for categorized item at index ${index}`);
          return null;
        }

        // Handle currency conversion if needed
        let displayAmount = t.amount;
        let originalAmount, originalCurrency;

        if (t.adjustment_info && t.adjustment_info.currency_conversion) {
          displayAmount = t.adjustment_info.currency_conversion.converted_amount;
          originalAmount = t.adjustment_info.currency_conversion.original_amount;
          originalCurrency = t.adjustment_info.currency_conversion.original_currency;
        }

        return {
          ...t,
          id: `imported-tx-${Date.now()}-${index}`,
          date: originalTx.date,
          description: t.cleaned_narrative || t.narrative,
          amount: displayAmount,
          originalAmount: originalAmount,
          originalCurrency: originalCurrency,
          baseCurrency: newBaseCurrency,
          category: t.predicted_category,
          account: originalTx.account || 'N/A',
          isDebit: t.amount < 0,
          confidence: t.similarity_score,
          isValidated: false,
          isSelected: false
        };
      }).filter((t: ValidationTransaction | null): t is ValidationTransaction => t !== null);

      setValidationTransactions(validated);
      setActiveTab('validate');
      setFeedback({ type: 'success', message: 'Transactions auto-classified. Please review and validate.' });
      
      if (autoClassifiedData.duplicate_report) {
        setDuplicateReport(autoClassifiedData.duplicate_report);
        setShowDuplicateReport(true);
      }

    } catch (error: any) {
      console.error('Error handling auto-classification:', error);
      const errorFeedback = handleClassifyError(error);
      setFeedback({ type: 'error', message: errorFeedback.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // CSV Processing Functions
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setFeedback({ type: 'info', message: `✅ File "${file.name}" selected! Starting intelligent analysis...` });
    setCsvStep('upload');
    
    // Small delay to show the immediate feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Automatically analyze the file
    await handleAnalyze(file);
  };

  const handleAnalyze = async (selectedFile: File) => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select a file first.'});
      return;
    }

    // isProcessing is already set by handleFileSelect
    setFeedback({ type: 'info', message: '🔍 Analyzing your CSV file structure and detecting columns...' });
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Step 1: Analyze the file structure
      const response = await fetch('/api/transactions/analyze', { 
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Analysis failed with status ${response.status}`);
      }

      setAnalysisResult(result);
      setFeedback({ type: 'info', message: '🤖 Getting AI-powered column mapping suggestions...' });
      
      // Step 2: Get AI mapping suggestions with sample data
      let aiSuggestions: Record<string, string> = {};
      try {
        // Pick 3 random sample rows for better AI analysis
        const sampleRows = result.previewRows.length > 5 
          ? result.previewRows.sort(() => 0.5 - Math.random()).slice(0, 5)
          : result.previewRows;

        const suggestionsResponse = await fetch('/api/csv/suggest-mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            headers: result.headers,
            sampleRows: sampleRows,
          }),
        });

        if (suggestionsResponse.ok) {
          const suggestionsResult = await suggestionsResponse.json();
          aiSuggestions = suggestionsResult.suggestions || {};
          console.log('AI suggestions received:', aiSuggestions);
        } else {
          console.warn('AI suggestions failed, falling back to basic auto-detection');
        }
      } catch (suggestionsError) {
        console.warn('AI suggestions error, falling back to basic auto-detection:', suggestionsError);
      }
      
      // Step 3: Combine AI suggestions with basic auto-detection fallback
      const initialMappings = result.headers.reduce((acc: Record<string, any>, header: string) => {
        // Start with AI suggestion if available
        if (aiSuggestions[header] && aiSuggestions[header] !== 'none') {
          acc[header] = aiSuggestions[header];
          return acc;
        }
        
        // Fallback to basic auto-detection
        acc[header] = 'none';
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('date') || lowerHeader.includes('created')) {
          acc[header] = 'date';
        } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('source amount')) {
          acc[header] = 'amount';
        } else if (lowerHeader.includes('desc') || lowerHeader.includes('payee') || lowerHeader.includes('memo') || lowerHeader.includes('target name') || lowerHeader.includes('reference') || lowerHeader.includes('details') || lowerHeader.includes('particulars')) {
          const hasDescriptionMapped = Object.values(acc).includes('description');
          acc[header] = hasDescriptionMapped ? 'description2' : 'description';
        } else if (lowerHeader.includes('currency')) {
          acc[header] = 'currency';
        } else if (lowerHeader.includes('direction') || lowerHeader.includes('type')) {
          acc[header] = 'direction';
        }
        return acc;
      }, {});

      // Enforce uniqueness for fields that should only be mapped once
      const uniqueAutoAssignFields = ['date', 'amount', 'currency', 'description', 'description2', 'direction'];
      uniqueAutoAssignFields.forEach(fieldType => {
        let foundFirst = false;
        Object.keys(initialMappings).forEach(header => {
          if (initialMappings[header] === fieldType) {
            if (foundFirst) {
              initialMappings[header] = 'none';
            } else {
              foundFirst = true;
            }
          }
        });
      });

      setConfig(prev => ({
        ...prev, 
        mappings: initialMappings, 
        delimiter: result.detectedDelimiter || prev.delimiter
      }));

      // Now show the configure screen with AI suggestions already applied
      setCsvStep('configure');
      
      const hasAiSuggestions = Object.keys(aiSuggestions).length > 0;
      setFeedback({ 
        type: 'success', 
        message: hasAiSuggestions 
          ? '🎉 File analyzed and AI suggestions applied! Review the mappings below.' 
          : '✅ File analyzed successfully! Please configure the column mappings below.' 
      });

    } catch (error: any) {
      setFeedback({ type: 'error', message: `Analysis Error: ${error.message}` });
      setAnalysisResult(null); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (csvHeader: string, fieldType: any) => {
    setConfig(prevConfig => {
      const newMappings = { ...prevConfig.mappings };

      const uniqueFields = ['date', 'amount', 'currency', 'description', 'description2', 'direction'];
      if (uniqueFields.includes(fieldType)) {
        const currentHeaderForField = Object.keys(newMappings).find(
          header => newMappings[header] === fieldType
        );
        if (currentHeaderForField && currentHeaderForField !== csvHeader) {
          newMappings[currentHeaderForField] = 'none';
        }
      }
      
      newMappings[csvHeader] = fieldType;
      
      return { ...prevConfig, mappings: newMappings };
    });
  };

  const validateAndProcessData = async () => {
    console.log('🚀 validateAndProcessData called with state:', {
      createNewSpreadsheetMode,
      'userData.transactions count': userData.transactions?.length || 0,
      uploadedFile: uploadedFile?.name,
      analysisResult: !!analysisResult,
      'config.mappings': Object.keys(config.mappings || {}).length
    });

    // Prevent concurrent processing
    if (isProcessing) {
      console.log('⚠️ Processing already in progress, ignoring duplicate request');
      return;
    }

    // Auto-detect if user should be in createNewSpreadsheetMode
    // If user has no linked spreadsheet, they should be creating a new one
    const shouldCreateNewSpreadsheet = !userData.spreadsheetId || !spreadsheetLinked;
    const effectiveCreateNewMode = shouldCreateNewSpreadsheet || createNewSpreadsheetMode;
    
    if (shouldCreateNewSpreadsheet && !createNewSpreadsheetMode) {
      console.log('🎯 Auto-detecting: User has no linked spreadsheet, will use createNewSpreadsheet logic');
      // Update the state for future calls, but continue with current call using effectiveCreateNewMode
      setCreateNewSpreadsheetMode(true);
    }

    if (!analysisResult || !config.mappings || !uploadedFile) {
      setFeedback({ type: 'error', message: 'No data to process. Please upload and configure a file first.' });
      return;
    }

    // Validation
    const requiredFields = ['date', 'amount', 'description'];
    const mappingValues = Object.values(config.mappings);
    const missingFields = requiredFields.filter(field => !mappingValues.includes(field as any));

    if (missingFields.length > 0) {
      setFeedback({ 
        type: 'error', 
        message: `Missing required fields: ${missingFields.join(', ')}. Please map these columns before processing.` 
      });
      return;
    }

    setIsProcessing(true);
    setFeedback({ type: 'info', message: 'Processing your transaction data...' });

    // Flag to control whether finally block should execute
    let shouldExecuteFinally = true;

    // Helper function to handle async polling without affecting main try-catch-finally
    const handleAsyncPolling = async (prediction_id: string, uniqueTransactions: any[], effectiveCreateNewMode: boolean) => {
      // Ensure processing state stays true during polling
      console.log('🔄 Starting async polling, keeping isProcessing = true');
      
      try {
        await pollForCompletion(
          prediction_id,
          'auto_classification',
          (pollingData) => {
            console.log('🔍 Auto-classification polling callback received completed data:', {
              hasData: !!pollingData,
              dataStructure: Object.keys(pollingData || {}),
              hasResults: !!(pollingData?.results),
              resultsLength: pollingData?.results?.length || 0,
              fullData: pollingData
            });
            
            // This callback is only called when status === 'completed'
            handleAutoClassificationComplete(pollingData, uniqueTransactions, effectiveCreateNewMode);
            // Note: handleAutoClassificationComplete calls setIsProcessing(false) in its finally block
          },
          (errorMessage) => {
            setFeedback({ type: 'error', message: `Auto-classification failed: ${errorMessage}` });
            setIsProcessing(false); // Re-enable button on error
          }
        );
      } catch (error) {
        console.error('Polling error:', error);
        setFeedback({ type: 'error', message: `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        setIsProcessing(false); // Re-enable button on polling error
      }
    };

    try {
      setFeedback({ type: 'success', message: 'Parsing CSV file...' });
      
      // Parse the full CSV file
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
              reject(new Error('Failed to parse CSV file'));
              return;
            }
            fullData = results.data as any[];
            resolve();
          },
          error: (error: Error) => {
            reject(error);
          }
        });
      });

      console.log('Parsed CSV data:', fullData.length, 'rows');
      console.log('First few rows:', fullData.slice(0, 3));

      // Additional validation to detect and filter out header rows
      const cleanedData = fullData.filter((row, index) => {
        // Check if this row looks like a header row
        const headerPatterns = ['description', 'narrative', 'merchant', 'amount', 'date', 'reference', 'details', 'memo', 'code', 'type', 'balance'];
        
        // Get mapped field values
        const dateHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'date');
        const amountHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'amount');
        const descriptionHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'description');
        
        if (dateHeader && amountHeader && descriptionHeader) {
          const dateValue = String(row[dateHeader] || '').toLowerCase().trim();
          const amountValue = String(row[amountHeader] || '').toLowerCase().trim();
          const descriptionValue = String(row[descriptionHeader] || '').toLowerCase().trim();
          
          // Debug log every row being processed
          console.log(`🔍 Processing row ${index}:`, {
            dateHeader,
            amountHeader,
            descriptionHeader,
            dateValue,
            amountValue,
            descriptionValue
          });
          
          // Check if any of these values match common header patterns
          const hasHeaderPattern = headerPatterns.some(pattern => 
            dateValue === pattern || 
            amountValue === pattern || 
            descriptionValue === pattern
          );
          
          if (hasHeaderPattern) {
            console.log(`❌ Filtering out row ${index} as it appears to be a header:`, {
              date: dateValue,
              amount: amountValue,
              description: descriptionValue
            });
            return false;
          }
          
          // Check if description and amount have the same value (duplicate mapping)
          if (descriptionValue && amountValue && descriptionValue === amountValue) {
            console.log(`❌ Filtering out row ${index} as description and amount have the same value:`, {
              description: descriptionValue,
              amount: amountValue
            });
            return false;
          }
          
          // Additional validation: check if amount contains only letters (not a number)
          if (amountValue && /^[a-zA-Z\s]+$/.test(amountValue)) {
            console.log(`❌ Filtering out row ${index} as amount contains only letters:`, {
              amount: amountValue
            });
            return false;
          }
          
          // Check if description contains only digits (wrong mapping)
          if (descriptionValue && /^\d+\.?\d*$/.test(descriptionValue)) {
            console.log(`❌ Filtering out row ${index} as description contains only digits:`, {
              description: descriptionValue
            });
            return false;
          }
        }
        
        return true;
      });

      console.log(`Filtered data: ${fullData.length} -> ${cleanedData.length} rows (removed ${fullData.length - cleanedData.length} header/invalid rows)`);
      
      if (cleanedData.length === 0) {
        throw new Error('No valid transaction data found. The CSV file may contain only headers or invalid data.');
      }

      // Process the cleaned data with concatenated descriptions
      const processedData = cleanedData.map(row => {
        const processedRow = { ...row };
        
        if (config.mappings) {
          const descriptionFields = Object.keys(config.mappings).filter(header => 
            config.mappings![header] === 'description' || config.mappings![header] === 'description2'
          );
          
          if (descriptionFields.length > 1) {
            const sortedDescFields = descriptionFields.sort((a, b) => {
              const aIsDesc = config.mappings![a] === 'description';
              const bIsDesc = config.mappings![b] === 'description';
              return aIsDesc && !bIsDesc ? -1 : !aIsDesc && bIsDesc ? 1 : 0;
            });
            
            const concatenatedDescription = sortedDescFields
              .map(header => String(row[header] || '').trim())
              .filter(desc => desc.length > 0)
              .join(' - ');
              
            const mainDescHeader = sortedDescFields.find(h => config.mappings![h] === 'description');
            if (mainDescHeader) {
              processedRow[mainDescHeader] = concatenatedDescription;
            }
          }
        }
        
        return processedRow;
      });

      // Transform to transaction format for categorization
      const rawTransactions = await Promise.all(processedData.map(async (row, index) => {
        const dateHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'date');
        const amountHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'amount');
        const descriptionHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'description');
        const currencyHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'currency');
        const directionHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'direction');
        
        // Enhanced validation for amount field during processing
        const rawAmount = row[amountHeader!];
        console.log(`🔍 Processing amount for row ${index}:`, { 
          amountHeader, 
          rawAmount: rawAmount, 
          type: typeof rawAmount 
        });

        // Validate that the amount is not obviously wrong
        if (rawAmount === null || rawAmount === undefined || rawAmount === '') {
          throw new Error(`Row ${index + 1}: Amount is missing or empty. Please check your CSV data.`);
        }

        // Enhanced amount parsing with accounting notation support
        let parsedAmount: number;
        const amountStr = String(rawAmount).trim();
        
        // Check for accounting bracket notation (e.g., "(100.00)" = -100.00)
        if (amountStr.match(/^\([0-9,\.]+\)$/)) {
          console.log(`🔢 Detected accounting bracket notation: ${amountStr}`);
          const numericPart = amountStr.replace(/[\(\),]/g, '');
          parsedAmount = -parseFloat(numericPart);
        } else {
          // Handle standard amount parsing with commas
          const cleanAmount = amountStr.replace(/[,\s]/g, '');
          parsedAmount = parseFloat(cleanAmount);
        }
        
        if (isNaN(parsedAmount)) {
          throw new Error(`Row ${index + 1}: Cannot parse amount "${rawAmount}". Expected a number but got: ${typeof rawAmount}. Please check your amount column mapping.`);
        }

        // Parse date with flexible format support
        const rawDate = row[dateHeader!];
        if (!rawDate) {
          throw new Error(`Row ${index + 1}: Date is missing. Please check your CSV data.`);
        }

        let parsedDate: Date = new Date(); // Initialize with default value
        const dateStr = String(rawDate).trim();
        let dateParseSuccess = false;
        
        // Try multiple date formats
        const dateFormats = [
          // Start with configured format (with fallback)
          config.dateFormat || 'yyyy-MM-dd',
          
          // ISO formats
          'yyyy-MM-dd',
          'yyyy/MM/dd',
          
          // US formats
          'MM/dd/yyyy',
          'MM/dd/yy',
          'M/d/yyyy',
          'M/d/yy',
          
          // European formats
          'dd/MM/yyyy',
          'dd/MM/yy',
          'd/M/yyyy',
          'd/M/yy',
          
          // Other common formats
          'dd-MM-yyyy',
          'MM-dd-yyyy',
          'yyyy-MM-dd HH:mm:ss',
          'MM/dd/yyyy HH:mm:ss'
        ];

        // Try parsing with each format until one succeeds
        for (const format of dateFormats) {
          try {
            const testDate = parse(dateStr, format, new Date());
            if (isValid(testDate)) {
              parsedDate = testDate;
              dateParseSuccess = true;
              if (format !== (config.dateFormat || 'yyyy-MM-dd')) {
                console.log(`📅 Successfully parsed date "${dateStr}" using format: ${format}`);
              }
              break;
            }
          } catch {
            continue;
          }
        }
        
        if (!dateParseSuccess) {
          throw new Error(`Row ${index + 1}: Cannot parse date "${rawDate}". Please check your date format or column mapping.`);
        }

        // Handle direction field if mapped
        let finalAmount = parsedAmount;
        if (directionHeader && row[directionHeader]) {
          const direction = String(row[directionHeader]).toLowerCase().trim();
          const isOutgoing = direction.includes('out') || direction.includes('debit') || direction.includes('dr') || direction.includes('withdrawal');
          const isIncoming = direction.includes('in') || direction.includes('credit') || direction.includes('cr') || direction.includes('deposit');
          
          // Apply direction logic if amount is positive
          if (parsedAmount > 0) {
            if (isOutgoing) {
              finalAmount = -Math.abs(parsedAmount);
            } else if (isIncoming) {
              finalAmount = Math.abs(parsedAmount);
            }
          }
          
          console.log(`📊 Direction processing: ${direction} → amount: ${parsedAmount} → final: ${finalAmount}`);
        }

        const description = String(row[descriptionHeader!] || '').trim();
        if (!description) {
          throw new Error(`Row ${index + 1}: Description is missing. Please check your CSV data.`);
        }

        return {
          date: format(parsedDate, 'yyyy-MM-dd'),
          amount: finalAmount,
          description: description,
          currency: currencyHeader ? String(row[currencyHeader] || 'USD') : 'USD',
        };
      }));

      console.log('Parsed transactions:', rawTransactions.slice(0, 3));

      // Duplicate detection
      const uniqueTransactions = filterDuplicateTransactions(rawTransactions);
      console.log(`Duplicate filtering: ${rawTransactions.length} -> ${uniqueTransactions.length} transactions (${rawTransactions.length - uniqueTransactions.length} duplicates removed)`);

      if (uniqueTransactions.length === 0) {
        throw new Error('All transactions appear to be duplicates of existing data. No new transactions to process.');
      }

      // Show duplicate summary if any were found
      if (rawTransactions.length > uniqueTransactions.length) {
        const duplicateCount = rawTransactions.length - uniqueTransactions.length;
        setFeedback({ 
          type: 'info', 
          message: `Found ${duplicateCount} duplicate transactions that were filtered out. Processing ${uniqueTransactions.length} new transactions...` 
        });
      }

      // Handle auto-classification - detect if we need to use training or auto-classification
      const hasTrainingData = userData.transactions && userData.transactions.length > 10;
      
      setFeedback({ 
        type: 'processing', 
        message: hasTrainingData 
          ? `🎯 Using your transaction history to classify ${uniqueTransactions.length} transactions...` 
          : `🤖 Auto-classifying ${uniqueTransactions.length} transactions...`
      });

      // Prepare data for classification
      const autoClassifyTransactions = uniqueTransactions.map(tx => ({
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        currency: tx.currency || 'USD',
      }));

      // Detect malformed transactions early
      const autoMalformedTransactions = autoClassifyTransactions.filter(tx => {
        const hasValidDate = tx.date && !isNaN(Date.parse(tx.date));
        const hasValidAmount = typeof tx.amount === 'number' && !isNaN(tx.amount) && tx.amount !== 0;
        const hasValidDescription = typeof tx.description === 'string' && tx.description.trim().length > 0;
        
        const isValid = hasValidDate && hasValidAmount && hasValidDescription;
        
        if (!isValid) {
          console.log('❌ Malformed transaction detected:', tx, {
            hasValidDate,
            hasValidAmount,
            hasValidDescription
          });
        }
        
        return !isValid;
      });

      if (autoMalformedTransactions.length > 0) {
        console.error(`❌ Found ${autoMalformedTransactions.length} malformed auto-classify transactions - aborting`);
        setFeedback({ 
          type: 'error', 
          message: `❌ Data validation failed: Found ${autoMalformedTransactions.length} transactions with invalid data (likely CSV header data or incorrect column mapping). Please check your CSV file and column mapping.` 
        });
        return;
      }

      // Validate auto-classification data before sending
      try {
        validateClassifyRequest({ transactions: autoClassifyTransactions });
      } catch (validationError) {
        console.error('Auto-classification data validation failed:', validationError);
        if (validationError instanceof Error && validationError.message.includes('mapping')) {
          setShowMappingGuide(true);
        }
        setFeedback({ 
          type: 'error', 
          message: `❌ Auto-classification data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}. Please check your CSV column mapping.` 
        });
        return;
      }
      
      // Compression-based processing for better accuracy
      // Processing all transactions together gives the AI better context and patterns
      const totalTransactions = autoClassifyTransactions.length;
      const useCompression = totalTransactions > 50; // Use compression for datasets larger than 50 transactions
      
      // Configure timeout based on dataset size and connection quality
      const baseTimeout = 60000; // 1 minute base
      const sizeMultiplier = Math.max(1, Math.ceil(totalTransactions / 100)); // Add time for larger datasets
      
      // Detect connection quality and adjust timeout accordingly
      let connectionMultiplier = 1;
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        console.log(`🌐 Connection: ${effectiveType}, downlink: ${connection.downlink}Mbps, rtt: ${connection.rtt}ms`);
        
        // Adjust timeout based on connection quality  
        if (effectiveType === 'slow-2g') connectionMultiplier = 3;
        else if (effectiveType === '2g') connectionMultiplier = 2.5;
        else if (effectiveType === '3g') connectionMultiplier = 1.5;
        
        // Factor in RTT for geographic latency (like Brazil → SFO)
        if (connection.rtt > 300) {
          connectionMultiplier *= 1.5;
          console.log(`🌍 High latency detected (${connection.rtt}ms), extending timeout`);
        }
      }
      
      const requestTimeout = Math.min(baseTimeout * sizeMultiplier * connectionMultiplier, 300000); // Max 5 minutes
      
      console.log(`⏱️ Setting request timeout to ${requestTimeout / 1000}s for ${totalTransactions} transactions (connection multiplier: ${connectionMultiplier})`);
      
      // Quick connection health check (non-blocking)
      try {
        console.log('🏥 Quick connection health check...');
        const healthResponse = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(3000) // Quick 3s timeout
        });
        if (!healthResponse.ok) {
          console.warn('⚠️ Health check warning - proceeding anyway');
          setFeedback({ type: 'processing', message: 'Network conditions detected, processing may take longer...' });
        }
      } catch (healthError) {
        console.warn('⚠️ Health check failed - proceeding anyway:', healthError);
      }
      
      // Simple retry mechanism for network resilience
      const makeRequestWithRetry = async (requestFn: () => Promise<Response>, requestType: string, maxRetries = 2): Promise<Response> => {
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
              console.log(`🔄 Retrying ${requestType} request (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms delay`);
              setFeedback({ 
                type: 'processing', 
                message: `Network issue detected, retrying ${requestType} request (attempt ${attempt + 1}/${maxRetries + 1})...` 
              });
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const response = await requestFn();
            
            // If we get here, request succeeded
            if (attempt > 0) {
              console.log(`✅ ${requestType} request succeeded on attempt ${attempt + 1}`);
            }
            
            return response;
            
          } catch (error: unknown) {
            const err = error as Error;
            lastError = err;
            
            // Don't retry on timeout errors (they're already max timeout)
            if (err instanceof DOMException && err.name === 'AbortError') {
              console.log(`⏱️ ${requestType} request timed out on attempt ${attempt + 1}, not retrying`);
              throw err;
            }
            
            // Don't retry on 4xx errors (client errors)
            if (err instanceof TypeError && err.message.includes('fetch')) {
              const errorStr = err.message.toLowerCase();
              if (errorStr.includes('400') || errorStr.includes('401') || errorStr.includes('403') || errorStr.includes('404')) {
                console.log(`❌ ${requestType} request failed with client error, not retrying:`, err.message);
                throw err;
              }
            }
            
            console.warn(`⚠️ ${requestType} request failed on attempt ${attempt + 1}:`, err.message);
            
            if (attempt === maxRetries) {
              console.error(`❌ ${requestType} request failed after ${maxRetries + 1} attempts`);
              throw lastError;
            }
          }
        }
        
        throw lastError || new Error(`${requestType} request failed after retries`);
      };
      
      if (useCompression) {
        console.log(`🗜️ Processing ${totalTransactions} transactions with compression for optimal accuracy`);
        setFeedback({ 
          type: 'processing', 
          message: `Compressing and processing ${totalTransactions} transactions together for better categorization accuracy...` 
        });
        
        try {
          // Import compression library dynamically to avoid SSR issues
          const { gzip } = await import('pako');
          
          // Prepare and compress the transaction data
          const transactionData = JSON.stringify({ transactions: autoClassifyTransactions });
          const originalSize = new TextEncoder().encode(transactionData).length;
          
          console.log(`Original data size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
          
          // Compress the data with optimal settings for speed
          const compressedData = gzip(transactionData, { 
            level: 6, // Balanced compression level (0-9, 6 is good balance of speed/size)
            windowBits: 15, // Standard window size  
            memLevel: 8 // Good memory usage
          });
          const compressedSize = compressedData.length;
          const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
          
          console.log(`Compressed data size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% reduction)`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.log(`⏱️ Request aborted after ${requestTimeout / 1000}s timeout`);
          }, requestTimeout);
          
          // Send compressed request with timeout
          const compressedResponse = await makeRequestWithRetry(
            () => fetch('/api/classify/auto-classify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Length': compressedSize.toString(),
                'X-Original-Size': originalSize.toString(),
                'X-Compression-Ratio': compressionRatio,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
              body: compressedData,
              signal: controller.signal
            }),
            'compressed request',
            2
          );
          
          // Clear timeout on successful response
          clearTimeout(timeoutId);
          
          // Compressed processing successful, check response status
          if (compressedResponse.status === 200) {
            // Check if it's synchronous completion or asynchronous processing
            const compressedResponseData = await compressedResponse.json();
            
            if (compressedResponse.ok && (compressedResponseData.status === 'completed' || compressedResponseData.success || compressedResponseData.results)) {
              // Synchronous auto-classification completion - handle immediately
              console.log('📥 Compressed auto-classify returned synchronous results, processing...');
              setFeedback({ 
                type: 'success', 
                message: `Successfully categorized ${totalTransactions} transactions together! (${compressionRatio}% size reduction, better accuracy through unified processing)` 
              });
              
              await handleAutoClassificationComplete(compressedResponseData, uniqueTransactions, effectiveCreateNewMode);
              return; // Exit after successful compressed processing
            } else {
              throw new Error(compressedResponseData.message || 'Compressed auto-classification completed but with unexpected response format');
            }
          } else if (compressedResponse.status === 202) {
            // Asynchronous compressed auto-classification - need to poll for completion
            const compressedResponseData = await compressedResponse.json();
            const { prediction_id, message: acceptanceMessage } = compressedResponseData;
            
            if (!prediction_id) {
              throw new Error('Compressed auto-classification job started but did not return a prediction ID');
            }
            
            setFeedback({ 
              type: 'processing', 
              message: `🚀 ${acceptanceMessage || `Compressed auto-classification job submitted. Processing your ${totalTransactions} transactions...`} (${compressionRatio}% size reduction)` 
            });
            
            // Start async polling - prevent finally block from executing
            shouldExecuteFinally = false;
            await handleAsyncPolling(prediction_id, uniqueTransactions, effectiveCreateNewMode);
            return; // Polling has completed or errored
          } else {
            const errorData = await compressedResponse.json().catch(() => ({ message: `Compressed auto-classification request failed with status ${compressedResponse.status}` }));
            throw new Error(errorData.message || errorData.error || `Compressed auto-classification request failed: ${compressedResponse.statusText}`);
          }
          
        } catch (compressedError) {
          console.log('🗜️ Compressed processing failed, falling back to uncompressed approach:', compressedError);
          setFeedback({ 
            type: 'processing', 
            message: 'Compression failed, falling back to standard processing...' 
          });
        }
      }

      // Fallback to uncompressed approach (or primary approach for smaller datasets)
      setFeedback({ 
        type: 'processing', 
        message: `Processing ${totalTransactions} transactions with auto-classification...` 
      });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`⏱️ Request aborted after ${requestTimeout / 1000}s timeout`);
      }, requestTimeout);

      try {
        const autoClassifyResponse = await makeRequestWithRetry(
          () => fetch('/api/classify/auto-classify', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Request-Type': 'uncompressed'
            },
            body: JSON.stringify({
              transactions: autoClassifyTransactions
            }),
            signal: controller.signal
          }),
          'uncompressed request',
          2
        );

        // Clear timeout on successful response
        clearTimeout(timeoutId);

        let autoClassifiedData: any;
        
        if (autoClassifyResponse.status === 200) {
          autoClassifiedData = await autoClassifyResponse.json();
          
          if (autoClassifyResponse.ok && (autoClassifiedData.status === 'completed' || autoClassifiedData.success || autoClassifiedData.results)) {
            console.log('📥 Uncompressed auto-classify returned synchronous results, processing...');
            setFeedback({ 
              type: 'success', 
              message: `Successfully auto-classified ${totalTransactions} transactions!` 
            });
            
            await handleAutoClassificationComplete(autoClassifiedData, uniqueTransactions, effectiveCreateNewMode);
            return; // Exit after successful processing
          } else {
            throw new Error(autoClassifiedData.message || 'Auto-classification completed but with unexpected response format');
          }
        } else if (autoClassifyResponse.status === 202) {
          // Asynchronous auto-classification - need to poll for completion
          const { prediction_id, message: acceptanceMessage } = await autoClassifyResponse.json();
          if (!prediction_id) {
            throw new Error('Auto-classification job started but did not return a prediction ID');
          }
          
          setFeedback({ type: 'processing', message: `🚀 ${acceptanceMessage || `Auto-classification job submitted. Processing your transactions...`}` });
          
          // Start async polling - prevent finally block from executing
          shouldExecuteFinally = false;
          await handleAsyncPolling(prediction_id, uniqueTransactions, effectiveCreateNewMode);
          return; // Polling has completed or errored
        } else {
          const errorData = await autoClassifyResponse.json().catch(() => ({ message: `Auto-classification request failed with status ${autoClassifyResponse.status}` }));
          throw new Error(errorData.message || errorData.error || `Auto-classification request failed: ${autoClassifyResponse.statusText}`);
        }
        
      } catch (uncompressedError) {
        // Clear timeout in case of error
        clearTimeout(timeoutId);
        
        // Handle timeout errors specifically
        if (uncompressedError instanceof DOMException && uncompressedError.name === 'AbortError') {
          throw new Error(`Request timed out after ${requestTimeout / 1000} seconds. This can happen with large datasets or slow connections. Please try again or contact support if the issue persists.`);
        }
        
        // Re-throw other errors
        throw uncompressedError;
      }

      // This code should only be reached for successful synchronous processing
      // Reset CSV processing state after successful categorization
      setTimeout(() => {
        setUploadedFile(null);
        setAnalysisResult(null);
        setCsvStep('upload');
        setConfig({
          mappings: {},
          dateFormat: commonDateFormats[1].value,
          amountFormat: 'standard',
          skipRows: 0,
        });
        setFeedback(null);
      }, 2000);

      posthog.capture('pf_transactions_processed', {
        file_name: uploadedFile?.name,
        file_size: uploadedFile?.size,
        file_type: uploadedFile?.type,
        is_first_time_user: !spreadsheetLinked,
      });

    } catch (error: any) {
      console.error('Transaction processing error:', error);
      
      // Enhanced error handling for validation and mapping issues
      const errorHandler = handleClassifyError(error);
      
      // Handle specific connection and size-related errors
      let errorMessage = errorHandler.message;
      let shouldShowCompressionAdvice = false;
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('connection reset') || msg.includes('connection error') || msg.includes('502')) {
          errorMessage = `🔗 Connection error occurred. This usually happens with large datasets. We use compression to reduce data size and improve reliability.`;
          shouldShowCompressionAdvice = true;
        } else if (msg.includes('request too large') || msg.includes('413')) {
          errorMessage = `📁 Request too large. We automatically compress large datasets to reduce size. If you continue to see this error, try uploading a smaller CSV file.`;
          shouldShowCompressionAdvice = true;
        } else if (msg.includes('timeout') || msg.includes('504') || msg.includes('408') || msg.includes('timed out')) {
          errorMessage = `⏱️ Request timeout. We use compression to speed up large dataset processing.`;
          shouldShowCompressionAdvice = true;
          
          // Add specific timeout guidance
          errorMessage += `\n\n📊 For large datasets, processing may take longer. Consider splitting into smaller batches if timeouts persist.`;
          
          // Add geographic latency guidance
          errorMessage += `\n\n🌐 If you're experiencing repeated timeouts, this may be due to network latency. The system automatically adjusts timeout limits based on dataset size.`;
          
        } else if (msg.includes('mapping') || msg.includes('validation')) {
          errorMessage = error.message; // Keep original validation messages
        }
      }
      
      // Add helpful advice for compression-related errors
      if (shouldShowCompressionAdvice) {
        errorMessage += `\n\n💡 Processing all transactions together provides better categorization accuracy by allowing the AI to see patterns across your entire dataset.`;
      }
      
      // Log additional debug info for timeout issues
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        console.error('🐛 Timeout Debug Info:', {
          fileSize: uploadedFile?.size || 0,
          fileName: uploadedFile?.name || 'unknown',
          userAgent: navigator.userAgent,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          } : 'unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      setFeedback({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      // Only call setIsProcessing(false) if we're NOT starting async polling
      // Async polling cases prevent this by setting shouldExecuteFinally = false
      if (shouldExecuteFinally) {
        setIsProcessing(false);
      }
    }
  };

  // Validation screen handlers
  const handleTransactionSelect = (transactionId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (isSelected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    // Get current page transactions
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageTransactions = validationTransactions.slice(startIndex, endIndex);
    
    // Check if all current page transactions are selected
    const allCurrentPageSelected = currentPageTransactions.every(t => selectedTransactions.has(t.id));
    
    const newSelected = new Set(selectedTransactions);
    
    if (allCurrentPageSelected) {
      // Deselect all current page transactions
      currentPageTransactions.forEach(t => newSelected.delete(t.id));
    } else {
      // Select all current page transactions
      currentPageTransactions.forEach(t => newSelected.add(t.id));
    }
    
    setSelectedTransactions(newSelected);
  };

  const handleValidateTransaction = (transactionId: string) => {
    setValidationTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, isValidated: true } : t
    ));
  };

  const handleValidateSelected = () => {
    const selectedIds = Array.from(selectedTransactions);
    setValidationTransactions(prev => prev.map(t => 
      selectedIds.includes(t.id) ? { ...t, isValidated: true } : t
    ));
    setSelectedTransactions(new Set());
  };

  const handleValidateAllRemaining = async () => {
    setIsValidatingAllRemaining(true);
    
    // Add a small delay to show loading feedback, especially useful for large datasets
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setValidationTransactions(prev => prev.map(t => 
      !t.isValidated ? { ...t, isValidated: true } : t
    ));
    setSelectedTransactions(new Set());
    
    setIsValidatingAllRemaining(false);
  };

  const handleEditCategory = (transactionId: string, newCategory: string) => {
    setValidationTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, category: newCategory, isValidated: true } : t
    ));
    setEditingTransaction(null);
    setEditCategory('');
  };

  const startEditingCategory = (transaction: ValidationTransaction) => {
    setEditingTransaction(transaction.id);
    setEditCategory(transaction.category);
  };

  const handleCurrencySelection = (selectedCurrency: string) => {
    setNewSpreadsheetCurrency(selectedCurrency);
    // Also update the user's base currency in the store for future use
    updateBaseCurrency(selectedCurrency);
    setShowCurrencySelection(false);
    // Now proceed with validation completion
    setTimeout(() => handleCompleteValidation(), 100);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    // Reset to first page when changing page size
    setCurrentPage(1);
  };

  // Get filtered, sorted, and paginated data
  const getFilteredSortedTransactions = () => {
    return validationTransactions
      .filter(t => {
        if (showOnlyUnvalidated && t.isValidated) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'date':
            aVal = new Date(a.date).getTime();
            bVal = new Date(b.date).getTime();
            break;
          case 'amount':
            aVal = Math.abs(a.amount);
            bVal = Math.abs(b.amount);
            break;
          case 'confidence':
            aVal = a.confidence || 0;
            bVal = b.confidence || 0;
            break;
          default:
            return 0;
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
  };

  const getPaginatedTransactions = () => {
    const filteredSorted = getFilteredSortedTransactions();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSorted.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredCount = getFilteredSortedTransactions().length;
    return Math.ceil(filteredCount / pageSize);
  };

  const getValidatedCount = () => {
    return validationTransactions.filter(t => t.isValidated).length;
  };

  const handleCompleteValidation = async () => {
    setIsProcessing(true);
    setFeedback({ type: 'processing', message: 'Writing validated transactions to your sheet...' });
    
    const validated = validationTransactions.filter(t => t.isValidated);

    const transactionsWithCurrency = validated.map(t => ({
      ...t,
      currency: t.originalCurrency || t.baseCurrency || baseCurrency
    }));

    posthog.capture('pf_validation_completed', {
      validated_count: validated.length,
      unvalidated_count: validationTransactions.length - validated.length,
      is_first_time_user: !spreadsheetLinked,
    });

    try {
      const accessToken = await requestSpreadsheetAccess();
      if (!accessToken) {
        throw new Error('Could not obtain Google Sheets access token.');
      }
      const response = await fetch('/api/sheets/append-validated-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transactions: transactionsWithCurrency,
          spreadsheetId: userData.spreadsheetId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API call failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Successfully appended transactions:', result);
      
      setFeedback({ 
        type: 'success', 
        message: `Successfully wrote ${result.appendedCount || validated.length} transactions to Google Sheet!` 
      });
      
      // Clear validation state
      setValidationTransactions([]);
      setSelectedTransactions(new Set());
      setCurrentPage(1);
      
      // Close drawer and navigate back to dashboard
      setTimeout(() => {
        console.log('🔄 Closing drawer and navigating to dashboard...');
        onClose();
        window.location.href = '/personal-finance';
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error completing validation:', error);
      
      let errorMessage = `Failed to write to spreadsheet: ${error.message}`;
      
      // Handle specific OAuth/authorization errors
      if (error.message.includes('access token') || error.message.includes('grant access')) {
        errorMessage = 'Google Sheets access required. Please grant permissions and try again.';
      } else if (error.message.includes('Permission denied')) {
        errorMessage = 'Permission denied. Please ensure you have Google Sheets access and try again.';
      }
      
      setFeedback({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Duplicate Report Component
  const DuplicateReport: React.FC<{ report: any; onClose: () => void }> = ({ report, onClose }) => {
    if (!report || !report.duplicates.length) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Duplicate Transactions Report</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Detection Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Strategy:</span> <span className="font-medium">{report.strategy}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Uploaded:</span> <span className="font-medium">{report.stats?.total || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Unique Transactions:</span> <span className="font-medium text-green-600">{report.stats?.unique || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Duplicates Found:</span> <span className="font-medium text-orange-600">{report.duplicateCount}</span>
                </div>
                <div>
                  <span className="text-blue-700">Match Existing Data:</span> <span className="font-medium">{report.stats?.duplicateWithExisting || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Duplicates in Upload:</span> <span className="font-medium">{report.stats?.duplicateWithinBatch || 0}</span>
                </div>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">Duplicate Transactions ({report.duplicates.length})</h4>
            <div className="space-y-3">
              {report.duplicates.map((dup: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  dup.reason === 'existing' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{dup.transaction.description}</div>
                      <div className="text-sm text-gray-600">
                        {dup.transaction.date} • ${Math.abs(dup.transaction.amount).toFixed(2)} • 
                        {dup.transaction.isDebit || dup.transaction.money_in === false ? ' Debit' : ' Credit'}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      dup.reason === 'existing' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dup.reason === 'existing' ? 'Matches Existing' : 'Duplicate in Upload'}
                    </div>
                  </div>
                  
                  {dup.existingMatches && dup.existingMatches.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Matches {dup.existingMatches.length} existing transaction(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Detection strategy: <span className="font-medium">{report.strategy}</span> 
                (considers date, amount, direction, and description)
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowPathIcon className="h-5 w-5 inline mr-2" />
              Manage Data
            </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
            Upload CSV
          </button>

          {validationTransactions.length > 0 && (
            <button
              onClick={() => setActiveTab('validate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckIcon className="h-5 w-5 inline mr-2" />
              Validate ({validationTransactions.filter(t => t.isValidated).length}/{validationTransactions.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CogIcon className="h-5 w-5 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Your data stays secure in your Google Sheets
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              We only temporarily read your spreadsheet for analysis and processing - nothing is stored on our servers. 
              You maintain full control and can revoke access anytime through your Google account settings.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'manage' && (
          <ManageDataTab
            spreadsheetLinked={spreadsheetLinked}
            spreadsheetUrl={spreadsheetUrl}
            onSpreadsheetLinked={onSpreadsheetLinked}
            onRefreshData={onRefreshData}
            isLoading={isLoading}
            onSwitchToUpload={() => setActiveTab('upload')}
            onCreateNewWithData={() => {
              console.log('🎯 onCreateNewWithData clicked - setting createNewSpreadsheetMode to true');
              setCreateNewSpreadsheetMode(true);
              setNewSpreadsheetCurrency('');
              setShowCurrencySelection(false);
              setActiveTab('upload');
              console.log('🎯 After setting - createNewSpreadsheetMode should now be true');
            }}
            error={error}
            onClearError={onClearError}
            data={spreadsheetData || {}}
          />
        )}

        {activeTab === 'upload' && (
          <UploadCSVTab
            createNewSpreadsheetMode={createNewSpreadsheetMode}
            uploadedFile={uploadedFile}
            csvStep={csvStep}
            analysisResult={analysisResult}
            config={config}
            feedback={feedback}
            isProcessing={isProcessing}
            lastTransaction={lastTransaction}
            duplicateReport={duplicateReport}
            onFileSelect={handleFileSelect}
            onMappingChange={handleMappingChange}
            onProcessTransactions={validateAndProcessData}
            onViewDuplicateReport={() => setShowDuplicateReport(true)}
          />
        )}

        {activeTab === 'validate' && validationTransactions.length > 0 && (
          <ValidateTransactionsTab
            validationTransactions={validationTransactions}
            paginatedTransactions={getPaginatedTransactions()}
            selectedTransactions={selectedTransactions}
            editingTransaction={editingTransaction}
            editCategory={editCategory}
            sortBy={sortBy}
            sortDirection={sortDirection}
            filterCategory={filterCategory}
            showOnlyUnvalidated={showOnlyUnvalidated}
            createNewSpreadsheetMode={createNewSpreadsheetMode}
            showCurrencySelection={showCurrencySelection}
            newSpreadsheetCurrency={newSpreadsheetCurrency}
            isProcessing={isProcessing}
            isValidatingAllRemaining={isValidatingAllRemaining}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={getTotalPages()}
            validatedCount={getValidatedCount()}
            totalFilteredItems={getFilteredSortedTransactions().length}
            onTransactionSelect={handleTransactionSelect}
            onSelectAll={handleSelectAll}
            onValidateTransaction={handleValidateTransaction}
            onValidateSelected={handleValidateSelected}
            onValidateAllRemaining={handleValidateAllRemaining}
            onEditCategory={handleEditCategory}
            onStartEditing={startEditingCategory}
            onStopEditing={() => setEditingTransaction(null)}
            onEditCategoryChange={setEditCategory}
            onSortChange={setSortBy}
            onSortDirectionToggle={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            onFilterCategoryChange={setFilterCategory}
            onShowOnlyUnvalidatedChange={setShowOnlyUnvalidated}
            onCompleteValidation={handleCompleteValidation}
            onCurrencySelection={handleCurrencySelection}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            baseCurrency={baseCurrency}
            onBaseCurrencyChange={updateBaseCurrency}
          />
        )}
      </div>
      </div>

      {/* CSV Mapping Guide Modal */}
      <CSVMappingGuide
        isVisible={showMappingGuide}
        onClose={() => setShowMappingGuide(false)}
      />

             {/* Duplicate Report Modal */}
       {showDuplicateReport && duplicateReport && (
         <DuplicateReport
           report={duplicateReport}
           onClose={() => setShowDuplicateReport(false)}
         />
       )}

    </>
  );
};

export default DataManagementDrawer;