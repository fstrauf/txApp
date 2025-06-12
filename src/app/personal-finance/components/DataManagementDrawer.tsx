'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { parseTransactionDate } from '@/lib/utils';
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
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';
import { convertCurrency, extractCurrencyCode } from '@/lib/currency';
import { ensureApiAccessForTraining } from '@/lib/apiKeyUtils';

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
  const { data: session } = useSession();
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
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showOnlyUnvalidated, setShowOnlyUnvalidated] = useState(false);
  const [createNewSpreadsheetMode, setCreateNewSpreadsheetMode] = useState(false);
  
  // Currency selection for new spreadsheet
  const [newSpreadsheetCurrency, setNewSpreadsheetCurrency] = useState<string>('');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  
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

  const filterDuplicateTransactions = (newTransactions: any[]) => {
    if (!userData.transactions || userData.transactions.length === 0) {
      return newTransactions; // No existing data, all transactions are new
    }

    // Create a set of existing transaction keys
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

  // Polling for completion similar to LunchMoney
  const pollForCompletion = async (
    predictionId: string,
    operationType: 'training' | 'classification',
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
        
        const pollingUrl = `/api/classify/status/${predictionId}`;
        console.log(`[Poll] Attempting fetch (${pollCount}/${maxPolls}): ${pollingUrl}`);

        try {
          const response = await fetch(pollingUrl);
          console.log(`[Poll] Response Status: ${response.status}`);

          if (!response.ok) {
            // Handle authentication errors immediately - don't retry
            if (response.status === 401) {
              const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
              const errorMessage = `Authentication failed: ${errorData.error || 'Invalid API key'}. Please check your API key configuration.`;
              console.error(`[Poll] Authentication error (401):`, errorMessage);
              setFeedback({ type: 'error', message: errorMessage });
              onError(errorMessage);
              return;
            }
            
            // Handle other non-retryable errors (403, 404, 500, etc.)
            if (response.status >= 400 && response.status !== 429) {
              const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
              const errorMessage = `Request failed (${response.status}): ${errorData.error || response.statusText}`;
              console.error(`[Poll] Non-retryable error:`, errorMessage);
              setFeedback({ type: 'error', message: errorMessage });
              onError(errorMessage);
              return;
            }
            
            // For retryable errors (429, network issues), retry a few times
            if (pollCount > 3) {
              throw new Error(`Status endpoint error: ${response.status} ${response.statusText}`);
            } else {
              console.warn(`[Poll] Status endpoint error (attempt ${pollCount}): ${response.status}. Retrying...`);
              setFeedback({ 
                type: 'info', 
                message: `🔄 ${operationType} in progress - checking status (attempt ${pollCount})...` 
              });
              continue;
            }
          }

          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`[Poll] Job status:`, data);

            if (data.status === 'completed') {
              console.log(`[Poll] Job completed. Data:`, data);
              setFeedback({ type: 'success', message: `${operationType} completed successfully!` });
              
              if (onSuccess) {
                await onSuccess(data);
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
    await executePoll();
  };

  // CSV Processing Functions
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setFeedback(null);
    setCsvStep('upload');
    
    // Automatically analyze the file
    await handleAnalyze(file);
  };

  const handleAnalyze = async (selectedFile: File) => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select a file first.'});
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/transactions/analyze', { 
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Analysis failed with status ${response.status}`);
      }

      setAnalysisResult(result);
      
      // Initialize mappings with auto-detection
      let initialMappings = result.headers.reduce((acc: Record<string, any>, header: string) => {
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
        }
        return acc;
      }, {});

      // Enforce uniqueness for auto-detected fields
      const uniqueAutoAssignFields = ['date', 'amount', 'currency', 'description', 'description2'];
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

      setCsvStep('configure');
      setFeedback({ type: 'success', message: 'File analyzed successfully! Please configure the column mappings below.' });

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

      const uniqueFields = ['date', 'amount', 'currency', 'description', 'description2'];
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

    console.log('🔍 CRITICAL DEBUG - createNewSpreadsheetMode value:', createNewSpreadsheetMode);
    console.log('🔍 CRITICAL DEBUG - typeof createNewSpreadsheetMode:', typeof createNewSpreadsheetMode);

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

      // Process the data with concatenated descriptions
      const processedData = fullData.map(row => {
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
        
        const originalAmount = parseFloat(String(row[amountHeader!] || '0'));
        const rawCurrency = currencyHeader ? String(row[currencyHeader] || baseCurrency) : baseCurrency;
        const originalCurrency = extractCurrencyCode(rawCurrency) || baseCurrency;
        
        // Debug currency extraction
        if (currencyHeader && rawCurrency !== originalCurrency) {
          console.log('Currency extracted:', { rawCurrency, originalCurrency, baseCurrency });
        }
        
        // Parse and format the date properly to avoid timezone issues
        const rawDate = row[dateHeader!] || new Date().toISOString().split('T')[0];
        const parsedDate = parseTransactionDate(String(rawDate));
        const formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Convert currency if needed
        let convertedAmount = Math.abs(originalAmount);
        if (originalCurrency !== baseCurrency) {
          try {
            convertedAmount = await convertCurrency(
              Math.abs(originalAmount),
              originalCurrency,
              baseCurrency,
              formattedDate
            );
          } catch (error) {
            console.warn(`Currency conversion failed for ${originalCurrency} to ${baseCurrency}:`, error);
            // Keep original amount if conversion fails
          }
        }

        return {
          id: `transaction-${index}`,
          date: formattedDate,
          description: String(row[descriptionHeader!] || 'Unknown'),
          amount: convertedAmount, // Use converted amount for processing
          originalAmount: Math.abs(originalAmount), // Keep original amount
          originalCurrency, // Store original currency
          baseCurrency, // Store base currency
          account: 'Uploaded CSV',
          isDebit: originalAmount < 0,
          money_in: originalAmount > 0, // For ML categorization API
        };
      }));

      // Filter out duplicate transactions early - but skip this for new spreadsheet mode
      let uniqueTransactions;
      let duplicateCount = 0;
      
      console.log('🔍 Duplicate filtering decision:', {
        createNewSpreadsheetMode,
        'rawTransactions.length': rawTransactions.length,
        'userData.transactions?.length': userData.transactions?.length || 0
      });
      
      if (effectiveCreateNewMode) {
        // When creating a new spreadsheet, process all transactions (no duplicate filtering)
        uniqueTransactions = rawTransactions;
        console.log('📋 Creating new spreadsheet - processing all transactions without duplicate filtering');
        console.log('📋 uniqueTransactions.length:', uniqueTransactions.length);
      } else {
        // For existing spreadsheets, filter out duplicates
        uniqueTransactions = filterDuplicateTransactions(rawTransactions);
        duplicateCount = rawTransactions.length - uniqueTransactions.length;
        console.log('🔍 Filtered duplicates - uniqueTransactions.length:', uniqueTransactions.length, 'duplicateCount:', duplicateCount);
      }

      if (uniqueTransactions.length === 0) {
        console.error('❌ uniqueTransactions.length is 0!', {
          createNewSpreadsheetMode,
          'rawTransactions.length': rawTransactions.length,
          'userData.transactions?.length': userData.transactions?.length || 0,
          duplicateCount
        });
        setFeedback({ 
          type: 'error', 
          message: `All ${rawTransactions.length} transactions are duplicates. No new data to process.` 
        });
        return;
      }

      if (duplicateCount > 0) {
        setFeedback({ 
          type: 'success', 
          message: `Found ${uniqueTransactions.length} new transactions (${duplicateCount} duplicates filtered out). Starting categorization...` 
        });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Processing ${uniqueTransactions.length} ${effectiveCreateNewMode ? '' : 'new '}transactions. Starting categorization...` 
        });
      }

      // Step 1: Check if we have existing data for training or use generic classification
      // When creating new spreadsheet, always use auto-classification since there's no training data
      const hasExistingData = userData.transactions && userData.transactions.length > 0;
      // FORCE auto-classify for new spreadsheet mode - no training should happen
      const shouldUseCustomModel = effectiveCreateNewMode ? false : hasExistingData;
      
      console.log('🔍 Training vs Auto-classify decision:', {
        hasExistingData,
        'userData.transactions': userData.transactions?.length || 0,
        createNewSpreadsheetMode,
        shouldUseCustomModel,
        'Flow choice': shouldUseCustomModel ? 'TRAINING + CLASSIFICATION' : 'AUTO-CLASSIFY',
        'Logic': effectiveCreateNewMode ? 'FORCED AUTO-CLASSIFY (new spreadsheet)' : hasExistingData ? 'TRAINING (has existing data)' : 'AUTO-CLASSIFY (no existing data)'
      });
      
      // EXPLICIT CHECKPOINT
      if (effectiveCreateNewMode) {
        console.log('✅ CONFIRMED: In createNewSpreadsheetMode - MUST use auto-classify');
        console.log('✅ shouldUseCustomModel should be FALSE:', shouldUseCustomModel);
      } else {
        console.log('ℹ️ NOT in createNewSpreadsheetMode - checking for existing data');
        console.log('ℹ️ hasExistingData:', hasExistingData);
        console.log('ℹ️ shouldUseCustomModel:', shouldUseCustomModel);
      }
      
      if (shouldUseCustomModel) {
        console.log('🚨 ABOUT TO CALL TRAINING ENDPOINT - This should NOT happen for createNewSpreadsheetMode!');
        // Subsequent upload - use custom model training + classification
        setFeedback({ type: 'success', message: 'Training custom model on your existing data...' });
        
        // Check and ensure API access before training
        try {
          setFeedback({ type: 'info', message: '🎯 Making this your own! Setting up your personal AI trainer...' });
          
          if (!session?.user?.id) {
            throw new Error('User not authenticated. Please log in to use AI training.');
          }
          
          const accessResult = await ensureApiAccessForTraining(session.user.id);
          
          if (!accessResult.success) {
            if (accessResult.needsSubscription) {
              setFeedback({ 
                type: 'error', 
                message: '💎 Upgrade needed! AI training requires an active subscription to create your personalized model. Please upgrade to continue.' 
              });
              return;
            } else {
              throw new Error(accessResult.message);
            }
          }
          
          setFeedback({ type: 'success', message: '🚀 All set! Training your personal AI model on your existing data...' });
        } catch (error) {
          console.error('Failed to setup API access:', error);
          setFeedback({ 
            type: 'error', 
            message: `❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.` 
          });
          return;
        }
        
        // Step 1: Train the model using existing transactions
        const trainResponse = await fetch('/api/classify/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: (userData.transactions || []).map(t => ({
              description: t.description,
              Category: t.category, // Fixed field name from predicted_category to Category
              money_in: !t.isDebit,
              amount: t.amount
            }))
          })
        });

        if (trainResponse.status === 200) {
          // Synchronous training completion
          const trainResult = await trainResponse.json();
          if (trainResponse.ok && (trainResult.success || trainResult.status === 'completed' || trainResult.message?.includes('completed successfully'))) {
            setFeedback({ type: 'success', message: 'Model trained! Now categorizing new transactions...' });
          } else {
            throw new Error(trainResult.message || 'Training failed despite 200 OK response');
          }
        } else if (trainResponse.status === 202) {
          // Asynchronous training - need to poll for completion
          const { prediction_id, message: acceptanceMessage } = await trainResponse.json();
          if (!prediction_id) {
            throw new Error('Training job started but did not return a prediction ID');
          }
          
          setFeedback({ type: 'processing', message: `🚀 ${acceptanceMessage || `Training job submitted. Processing your data...`}` });
          
          // Wait for training to complete via polling
          await new Promise((resolve, reject) => {
            pollForCompletion(
              prediction_id,
              'training',
              (pollingData) => {
                setFeedback({ type: 'success', message: 'Model trained via polling! Now categorizing new transactions...' });
                resolve(pollingData);
              },
              (errorMessage) => {
                reject(new Error(errorMessage));
              }
            );
          });
        } else {
          const errorData = await trainResponse.json().catch(() => ({ message: `Training request failed with status ${trainResponse.status}` }));
          throw new Error(errorData.message || errorData.error || `Training request failed: ${trainResponse.statusText}`);
        }

        // Step 2: Classify new transactions using the trained model
        const classifyResponse = await fetch('/api/classify/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: uniqueTransactions.map(t => ({
              description: t.description,
              money_in: t.money_in,
              amount: t.amount
            }))
          })
        });

        let classifiedData: any;

        if (classifyResponse.status === 200) {
          // Synchronous classification completion
          classifiedData = await classifyResponse.json();
          
          if (classifyResponse.ok && (classifiedData.status === 'completed' || classifiedData.success || classifiedData.results)) {
            // Validation successful - proceed
          } else {
            throw new Error(classifiedData.message || 'Classification completed but with unexpected response format');
          }
        } else if (classifyResponse.status === 202) {
          // Asynchronous classification - need to poll for completion
          const { prediction_id, message: acceptanceMessage } = await classifyResponse.json();
          if (!prediction_id) {
            throw new Error('Classification job started but did not return a prediction ID');
          }
          
          setFeedback({ type: 'processing', message: `🚀 ${acceptanceMessage || `Classification job submitted. Processing your transactions...`}` });
          
          // Wait for classification to complete via polling
          classifiedData = await new Promise((resolve, reject) => {
            pollForCompletion(
              prediction_id,
              'classification',
              (pollingData) => {
                setFeedback({ type: 'success', message: 'Classification completed via polling!' });
                resolve(pollingData || { results: [] });
              },
              (errorMessage) => {
                reject(new Error(errorMessage));
              }
            );
          });
        } else {
          const errorData = await classifyResponse.json().catch(() => ({ message: `Classification request failed with status ${classifyResponse.status}` }));
          throw new Error(errorData.message || errorData.error || `Classification request failed: ${classifyResponse.statusText}`);
        }
        
        // Validate API response
        if (!classifiedData.results || !Array.isArray(classifiedData.results)) {
          throw new Error('Invalid response from classification API - no results array');
        }

        if (classifiedData.results.length !== uniqueTransactions.length) {
          console.warn('Classification results count mismatch:', {
            expectedCount: uniqueTransactions.length,
            actualCount: classifiedData.results.length
          });
        }
        
        // Transform classified results back to full transaction format
        const categorizedTransactions = classifiedData.results.map((result: any, index: number) => ({
          ...uniqueTransactions[index],
          id: `transaction-${index}`,
          category: result.predicted_category || 'Uncategorized',
          predicted_category: result.predicted_category,
          similarity_score: result.similarity_score,
          confidence: result.similarity_score || 0, // Use similarity_score as confidence
          isValidated: false,
          isSelected: false,
          account: 'Imported'
        }));

        setValidationTransactions(categorizedTransactions);
        setActiveTab('validate');
        setFeedback({ 
          type: 'success', 
          message: `Categorized ${categorizedTransactions.length} transactions. Please review and validate!` 
        });

      } else {
        console.log('✅ TAKING AUTO-CLASSIFY PATH - This is correct for createNewSpreadsheetMode');
        // First upload or creating new spreadsheet - use generic auto-classify
        const message = effectiveCreateNewMode 
          ? 'Categorizing transactions for your new spreadsheet...'
          : 'Using generic auto-classification for first upload...';
        setFeedback({ type: 'success', message });
        
        const autoClassifyResponse = await fetch('/api/classify/auto-classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: uniqueTransactions.map(t => ({
              description: t.description,
              money_in: t.money_in,
              amount: t.amount
            }))
          })
        });

        let autoClassifiedData: any;

        if (autoClassifyResponse.status === 200) {
          // Synchronous auto-classification completion
          autoClassifiedData = await autoClassifyResponse.json();
          
          if (autoClassifyResponse.ok && (autoClassifiedData.status === 'completed' || autoClassifiedData.success || autoClassifiedData.results)) {
            // Validation successful - proceed
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
          
          // Wait for auto-classification to complete via polling
          autoClassifiedData = await new Promise((resolve, reject) => {
            pollForCompletion(
              prediction_id,
              'classification',
              (pollingData) => {
                setFeedback({ type: 'success', message: 'Auto-classification completed via polling!' });
                resolve(pollingData || { results: [] });
              },
              (errorMessage) => {
                reject(new Error(errorMessage));
              }
            );
          });
        } else {
          const errorData = await autoClassifyResponse.json().catch(() => ({ message: `Auto-classification request failed with status ${autoClassifyResponse.status}` }));
          throw new Error(errorData.message || errorData.error || `Auto-classification request failed: ${autoClassifyResponse.statusText}`);
        }
        
        // Validate API response
        if (!autoClassifiedData.results || !Array.isArray(autoClassifiedData.results)) {
          throw new Error('Invalid response from auto-classification API - no results array');
        }

        if (autoClassifiedData.results.length !== uniqueTransactions.length) {
          console.warn('Auto-classification results count mismatch:', {
            expectedCount: uniqueTransactions.length,
            actualCount: autoClassifiedData.results.length
          });
        }
        
        // Transform auto-classified results back to full transaction format
        const categorizedTransactions = autoClassifiedData.results.map((result: any, index: number) => ({
          ...uniqueTransactions[index],
          id: `transaction-${index}`,
          category: result.predicted_category || 'Uncategorized',
          predicted_category: result.predicted_category,
          similarity_score: result.similarity_score,
          confidence: result.similarity_score || 0, // Use similarity_score as confidence
          isValidated: false,
          isSelected: false,
          account: 'Imported'
        }));

        setValidationTransactions(categorizedTransactions);
        setActiveTab('validate');
        const successMessage = effectiveCreateNewMode
          ? `Categorized ${categorizedTransactions.length} transactions for your new spreadsheet. Please review and validate!`
          : `Auto-classified ${categorizedTransactions.length} transactions using generic model. Please review and validate!`;
        setFeedback({ 
          type: 'success', 
          message: successMessage
        });
      }

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

    } catch (error: any) {
      console.error('Transaction processing error:', error);
      setFeedback({ type: 'error', message: `Processing error: ${error.message}` });
    } finally {
      setIsProcessing(false);
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
    if (selectedTransactions.size === validationTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(validationTransactions.map(t => t.id)));
    }
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

  const handleValidateAllRemaining = () => {
    setValidationTransactions(prev => prev.map(t => 
      !t.isValidated ? { ...t, isValidated: true } : t
    ));
    setSelectedTransactions(new Set());
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

  const handleCompleteValidation = async () => {
    const validatedTransactions = validationTransactions.filter(t => t.isValidated);
    
    console.log('🔄 Starting validation completion...', {
      validatedCount: validatedTransactions.length,
      totalCount: validationTransactions.length,
      createNewSpreadsheetMode,
      spreadsheetId: userData.spreadsheetId,
      spreadsheetUrl: userData.spreadsheetUrl,
      hasSpreadsheetId: !!userData.spreadsheetId,
      hasSpreadsheetUrl: !!userData.spreadsheetUrl,
      currentBaseCurrency: baseCurrency,
      newSpreadsheetCurrency: newSpreadsheetCurrency
    });
    
    if (validatedTransactions.length === 0) {
      setFeedback({ type: 'error', message: 'Please validate at least one transaction before completing.' });
      return;
    }

    // Check if in create new spreadsheet mode and need to collect currency
    if (createNewSpreadsheetMode) {
      // Always show currency selection for new spreadsheets if not already selected
      if (!newSpreadsheetCurrency) {
        setShowCurrencySelection(true);
        return;
      }
      
      // Use the selected currency for new spreadsheet
      const currencyToUse = newSpreadsheetCurrency;
      
      setIsProcessing(true);
      setFeedback({ type: 'info', message: 'Creating new spreadsheet with your data...' });

      try {
        console.log('🔑 Getting fresh OAuth access token for new spreadsheet...');
        setFeedback({ type: 'info', message: 'Requesting Google Sheets access permissions...' });
        
        // Use requestSpreadsheetAccess instead of getValidAccessToken to handle expired tokens
        const accessToken = await requestSpreadsheetAccess();
        if (!accessToken) {
          throw new Error('Unable to get valid Google access token. Please grant access to Google Sheets and try again.');
        }
        console.log('✅ Got fresh access token for new spreadsheet creation');
        
        setFeedback({ type: 'info', message: 'Creating new spreadsheet with your data...' });

        console.log('📊 Creating new spreadsheet from template with data...');
        // Create new spreadsheet from template with data
        const response = await fetch('/api/sheets/create-from-template-copy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            transactions: validatedTransactions,
            title: `ExpenseSorted Finance Tracker - ${new Date().toLocaleDateString()}`,
            baseCurrency: currencyToUse
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create spreadsheet');
        }

        console.log('✅ New spreadsheet created:', result);

        // Update user record with new spreadsheet info  
        console.log('🔗 Linking new spreadsheet to user account...');
        const linkResponse = await fetch('/api/dashboard/link-spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            spreadsheetUrl: result.spreadsheetUrl,
            accessToken 
          }),
        });

        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          
          // Update store with validated transactions
          processTransactionData(validatedTransactions);
          
          // Success feedback
          setFeedback({ 
            type: 'success', 
            message: `🎉 Created new spreadsheet with ${validatedTransactions.length} transactions!` 
          });
          
          // Open the new spreadsheet
          window.open(result.spreadsheetUrl, '_blank');
          
          // Reset state and notify parent
          setValidationTransactions([]);
          setSelectedTransactions(new Set());
          setCreateNewSpreadsheetMode(false);
          setNewSpreadsheetCurrency('');
          setShowCurrencySelection(false);
          
          setTimeout(() => {
            onSpreadsheetLinked(linkData);
            setActiveTab('manage');
            onClose();
          }, 2000);
          
          return;
        } else {
          throw new Error('Failed to link new spreadsheet to account');
        }

      } catch (error: any) {
        console.error('❌ Error creating new spreadsheet:', error);
        
        let errorMessage = `Failed to create spreadsheet: ${error.message}`;
        
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
        setIsProcessing(false);
        return;
      }
    }

    // Original logic for existing spreadsheets
    if (!userData.spreadsheetId) {
      setFeedback({ type: 'error', message: 'No spreadsheet linked. Please link a Google Sheet first.' });
      return;
    }

    setIsProcessing(true);
    setFeedback({ type: 'info', message: 'Writing transactions to Google Sheet...' });

    try {
      console.log('📊 Updating store with validated transactions...');
      // Update the store with validated transactions
      processTransactionData(validatedTransactions);

      console.log('🔑 Getting fresh OAuth access token for spreadsheet access...');
      setFeedback({ type: 'info', message: 'Requesting Google Sheets access permissions...' });
      
      // Use requestSpreadsheetAccess instead of getValidAccessToken to handle expired tokens
      const accessToken = await requestSpreadsheetAccess();
      if (!accessToken) {
        throw new Error('Unable to get valid Google access token. Please grant access to Google Sheets and try again.');
      }
      console.log('✅ Got valid access token, calling API...');

      console.log('📝 Calling API to append transactions to spreadsheet...');
      setFeedback({ type: 'info', message: 'Writing transactions to your Google Sheet...' });
      
      const response = await fetch('/api/sheets/append-validated-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transactions: validatedTransactions,
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
        message: `Successfully wrote ${result.appendedCount || validatedTransactions.length} transactions to Google Sheet!` 
      });
      
      // Clear validation state
      setValidationTransactions([]);
      setSelectedTransactions(new Set());
      
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

  return (
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
            onFileSelect={handleFileSelect}
            onMappingChange={handleMappingChange}
            onProcessTransactions={validateAndProcessData}
          />
        )}

        {activeTab === 'validate' && validationTransactions.length > 0 && (
          <ValidateTransactionsTab
            validationTransactions={validationTransactions}
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
  );
};

export default DataManagementDrawer;