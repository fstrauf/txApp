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

        // Validate that amount field contains numeric data
        if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
          const amountStr = String(rawAmount).trim();
          
          // Check if amount field contains description-like text
          if (amountStr.toLowerCase().includes('description') ||
              amountStr.toLowerCase().includes('narrative') ||
              amountStr.toLowerCase().includes('merchant') ||
              amountStr.toLowerCase().includes('reference') ||
              /^[a-zA-Z\s]{3,}$/.test(amountStr)) {
            throw new Error(`❌ Column mapping error in row ${index + 1}: Amount field contains "${amountStr}" which appears to be text, not a number. Please check your column mapping and ensure the amount column is mapped to a numeric field.`);
          }

          // Check if the value can be parsed as a number
          const parsedAmount = parseFloat(amountStr);
          if (isNaN(parsedAmount)) {
            throw new Error(`❌ Invalid amount in row ${index + 1}: "${amountStr}" cannot be converted to a number. Please check your column mapping.`);
          }
        }

        const originalAmount = parseFloat(String(rawAmount || '0'));
        const rawCurrency = currencyHeader ? String(row[currencyHeader] || baseCurrency) : baseCurrency;
        const originalCurrency = extractCurrencyCode(rawCurrency) || baseCurrency;
        
        // Handle direction field to determine if transaction is debit or credit
        let isDebit = originalAmount < 0; // Default based on amount sign
        let money_in = originalAmount > 0; // Default based on amount sign
        
        // Debug direction field mapping
        console.log('🔍 Direction field debug:', {
          index,
          directionHeader,
          'row[directionHeader]': directionHeader ? row[directionHeader] : 'N/A',
          'config.mappings': config.mappings,
          originalAmount,
          'default isDebit': isDebit,
          'default money_in': money_in
        });
        
        if (directionHeader && row[directionHeader]) {
          const directionValue = String(row[directionHeader]).trim().toLowerCase();
          
          console.log('🎯 Processing direction field:', {
            index,
            directionHeader,
            rawDirectionValue: row[directionHeader],
            directionValue,
            originalAmount
          });
          
          // Determine transaction direction based on various formats
          if (['out', 'debit', 'dr', '-', 'negative'].includes(directionValue)) {
            isDebit = true;
            money_in = false;
            console.log('✅ Direction matched DEBIT pattern:', directionValue);
          } else if (['in', 'credit', 'cr', '+', 'positive'].includes(directionValue)) {
            isDebit = false;
            money_in = true;
            console.log('✅ Direction matched CREDIT pattern:', directionValue);
          } else if (directionValue === 'neutral') {
            // For neutral transactions, keep original amount sign logic
            isDebit = originalAmount < 0;
            money_in = originalAmount > 0;
            console.log('✅ Direction matched NEUTRAL pattern:', directionValue);
          } else {
            console.log('⚠️ Direction value not recognized:', directionValue, 'keeping default logic');
          }
          
          console.log('🔄 Final direction processing result:', {
            index,
            directionValue,
            originalAmount,
            isDebit,
            money_in
          });
        } else {
          console.log('⚠️ No direction field found or empty:', {
            index,
            directionHeader,
            'row[directionHeader]': directionHeader ? row[directionHeader] : 'N/A'
          });
        }
        
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
          isDebit, // Use direction-aware logic
          money_in, // Use direction-aware logic
          direction: directionHeader ? String(row[directionHeader] || '') : undefined, // Store original direction value
        };
      }));

      // Filter out duplicate transactions early - but skip this for new spreadsheet mode
      let uniqueTransactions;
      let duplicateCount = 0;
      let duplicateDetails: any = null;
      
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
        // For existing spreadsheets, use enhanced duplicate detection
        console.log('🔍 Running enhanced duplicate detection...');
        
        const detectionResult = detectDuplicateTransactions(rawTransactions, 'moderate');
        uniqueTransactions = detectionResult.uniqueTransactions;
        duplicateCount = detectionResult.duplicateCount;
        duplicateDetails = detectionResult;
        
        console.log('🔍 Enhanced duplicate detection results:', {
          strategy: detectionResult.strategy,
          total: detectionResult.stats?.total || 0,
          unique: detectionResult.stats?.unique || 0,
          duplicateWithExisting: detectionResult.stats?.duplicateWithExisting || 0,
          duplicateWithinBatch: detectionResult.stats?.duplicateWithinBatch || 0,
          totalDuplicates: duplicateCount
        });
        
        // Store duplicate report for user viewing
        if (detectionResult.duplicates.length > 0) {
          setDuplicateReport(detectionResult);
        }
        
        // Log detailed duplicate information
        if (detectionResult.duplicates.length > 0) {
          console.log('📋 Duplicate transactions found:');
          detectionResult.duplicates.forEach((dup, index) => {
            console.log(`  ${index + 1}. ${dup.transaction.description} (${dup.transaction.amount}) - ${dup.reason}`);
          });
        }
      }

      if (uniqueTransactions.length === 0) {
        console.error('❌ uniqueTransactions.length is 0!', {
          createNewSpreadsheetMode,
          'rawTransactions.length': rawTransactions.length,
          'userData.transactions?.length': userData.transactions?.length || 0,
          duplicateCount
        });
        
        // Provide detailed feedback about why no transactions were processed
        if (duplicateDetails && duplicateDetails.duplicates.length > 0) {
          const duplicateExamples = duplicateDetails.duplicates.slice(0, 3).map((dup: any) => 
            `"${dup.transaction.description}" (${dup.transaction.amount})`
          ).join(', ');
          
          setFeedback({ 
            type: 'error', 
            message: `All ${rawTransactions.length} transactions are duplicates of existing data. Examples: ${duplicateExamples}${duplicateDetails.duplicates.length > 3 ? '...' : ''}. Try uploading transactions from a different date range.` 
          });
        } else {
          setFeedback({ 
            type: 'error', 
            message: `All ${rawTransactions.length} transactions are duplicates. No new data to process.` 
          });
        }
        return;
      }

      // Pre-validate processed transaction data to catch mapping issues early
      try {
        const sampleTransactions = uniqueTransactions.slice(0, 3).map(t => ({
          description: t.description,
          money_in: t.money_in,
          amount: t.amount
        }));
        
        const preValidation = validateCsvMappingData(sampleTransactions);
        if (!preValidation.isValid) {
          setShowMappingGuide(true);
          setFeedback({ 
            type: 'error', 
            message: `❌ Data mapping validation failed:\n${preValidation.errors.join('\n')}\n\nPlease check your CSV column mapping and try again.` 
          });
          return;
        }
      } catch (preValidationError) {
        console.error('Pre-validation failed:', preValidationError);
        setFeedback({ 
          type: 'error', 
          message: `❌ Data validation failed: ${preValidationError instanceof Error ? preValidationError.message : 'Unknown error'}. Please check your CSV column mapping.` 
        });
        return;
      }

      if (duplicateCount > 0) {
        const duplicateMessage = duplicateDetails ? 
          `Found ${uniqueTransactions.length} new transactions. Filtered out ${duplicateCount} duplicates (${duplicateDetails.stats?.duplicateWithExisting || 0} match existing data, ${duplicateDetails.stats?.duplicateWithinBatch || 0} duplicates within upload).` :
          `Found ${uniqueTransactions.length} new transactions (${duplicateCount} duplicates filtered out).`;
          
        setFeedback({ 
          type: 'success', 
          message: `${duplicateMessage} Starting categorization...`
        });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Processing ${uniqueTransactions.length} ${effectiveCreateNewMode ? '' : 'new '}transactions. Starting categorization...` 
        });
      }

      // Clear any previous duplicate report when starting new processing
      if (!duplicateDetails || duplicateDetails.duplicates.length === 0) {
        setDuplicateReport(null);
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

              }
      
      if (shouldUseCustomModel) {

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
              
              // Redirect to API key page after showing the message
              setTimeout(() => {
                router.push('/api-key');
              }, 2000); // Give user time to read the message
              
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
        
        // Prepare training data with validation
        const trainingTransactions = (userData.transactions || []).map(t => ({
          description: t.description,
          Category: t.category, // Fixed field name from predicted_category to Category
          money_in: !t.isDebit,
          amount: t.amount
        }));

        // Validate training data before sending
        try {
          validateClassifyRequest({ transactions: trainingTransactions });
        } catch (validationError) {
          console.error('Training data validation failed:', validationError);
          if (validationError instanceof Error && validationError.message.includes('mapping')) {
            setShowMappingGuide(true);
          }
          setFeedback({ 
            type: 'error', 
            message: `❌ Training data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}. Please check your existing transaction data.` 
          });
          return;
        }
        
        // Step 1: Train the model using existing transactions
        const trainResponse = await fetch('/api/classify/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: trainingTransactions
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

        // Prepare classification data with validation
        const classificationTransactions = uniqueTransactions.map(t => ({
          description: t.description,
          money_in: t.money_in,
          amount: t.amount
        }));

        // Final validation check - ensure no malformed data gets through
        const malformedTransactions = classificationTransactions.filter((t, index) => {
          const desc = String(t.description || '').toLowerCase().trim();
          const amt = String(t.amount || '').toLowerCase().trim();
          
          // Check for header patterns
          const headerPatterns = ['description', 'narrative', 'merchant', 'amount', 'date', 'reference', 'details', 'memo'];
          const isHeaderDesc = headerPatterns.some(pattern => desc === pattern);
          const isHeaderAmt = headerPatterns.some(pattern => amt === pattern);
          
          // Check for duplicate values
          const isDuplicate = desc === amt && desc !== '';
          
          // Check if amount is not numeric
          const isAmountNonNumeric = isNaN(parseFloat(amt)) && amt !== '';
          
          if (isHeaderDesc || isHeaderAmt || isDuplicate || isAmountNonNumeric) {
            console.error(`❌ Malformed transaction detected at index ${index}:`, {
              description: t.description,
              amount: t.amount,
              money_in: t.money_in,
              issues: {
                isHeaderDesc,
                isHeaderAmt,
                isDuplicate,
                isAmountNonNumeric
              }
            });
            return true;
          }
          return false;
        });

        if (malformedTransactions.length > 0) {
          console.error(`❌ Found ${malformedTransactions.length} malformed transactions - aborting classification`);
          setFeedback({ 
            type: 'error', 
            message: `❌ Data validation failed: Found ${malformedTransactions.length} transactions with invalid data (likely CSV header data or incorrect column mapping). Please check your CSV file and column mapping.` 
          });
          return;
        }

        // Validate classification data before sending
        try {
          validateClassifyRequest({ transactions: classificationTransactions });
        } catch (validationError) {
          console.error('Classification data validation failed:', validationError);
          if (validationError instanceof Error && validationError.message.includes('mapping')) {
            setShowMappingGuide(true);
          }
          setFeedback({ 
            type: 'error', 
            message: `❌ Classification data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}. Please check your CSV column mapping.` 
          });
          return;
        }

        // Step 2: Classify new transactions using the trained model
        const classifyResponse = await fetch('/api/classify/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: classificationTransactions
          })
        });

        let classifiedData: any;

        if (classifyResponse.status === 200) {
          // Check if it's synchronous completion or asynchronous processing
          classifiedData = await classifyResponse.json();
          
          if (classifyResponse.ok && (classifiedData.status === 'completed' || classifiedData.success || classifiedData.results)) {
            // Synchronous classification completion - proceed
          } else if (classifiedData.status === 'processing' && classifiedData.prediction_id) {
            // Asynchronous classification returned as 200 with processing status
            const { prediction_id, message: acceptanceMessage } = classifiedData;
            
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

        // First upload or creating new spreadsheet - use generic auto-classify
        const message = effectiveCreateNewMode 
          ? 'Categorizing transactions for your new spreadsheet...'
          : 'Using generic auto-classification for first upload...';
        setFeedback({ type: 'success', message });
        
        // Prepare auto-classification data with validation
        const autoClassifyTransactions = uniqueTransactions.map(t => ({
          description: t.description,
          money_in: t.money_in,
          amount: t.amount
        }));

        // Final validation check - ensure no malformed data gets through
        const autoMalformedTransactions = autoClassifyTransactions.filter((t, index) => {
          const desc = String(t.description || '').toLowerCase().trim();
          const amt = String(t.amount || '').toLowerCase().trim();
          
          // Check for header patterns
          const headerPatterns = ['description', 'narrative', 'merchant', 'amount', 'date', 'reference', 'details', 'memo'];
          const isHeaderDesc = headerPatterns.some(pattern => desc === pattern);
          const isHeaderAmt = headerPatterns.some(pattern => amt === pattern);
          
          // Check for duplicate values
          const isDuplicate = desc === amt && desc !== '';
          
          // Check if amount is not numeric
          const isAmountNonNumeric = isNaN(parseFloat(amt)) && amt !== '';
          
          if (isHeaderDesc || isHeaderAmt || isDuplicate || isAmountNonNumeric) {
            console.error(`❌ Malformed auto-classify transaction detected at index ${index}:`, {
              description: t.description,
              amount: t.amount,
              money_in: t.money_in,
              issues: {
                isHeaderDesc,
                isHeaderAmt,
                isDuplicate,
                isAmountNonNumeric
              }
            });
            return true;
          }
          return false;
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
        
        const autoClassifyResponse = await fetch('/api/classify/auto-classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: autoClassifyTransactions
          })
        });

        let autoClassifiedData: any;

        if (autoClassifyResponse.status === 200) {
          // Check if it's synchronous completion or asynchronous processing
          autoClassifiedData = await autoClassifyResponse.json();
          
          if (autoClassifyResponse.ok && (autoClassifiedData.status === 'completed' || autoClassifiedData.success || autoClassifiedData.results)) {
            // Synchronous auto-classification completion - proceed
          } else if (autoClassifiedData.status === 'processing' && autoClassifiedData.prediction_id) {
            // Asynchronous auto-classification returned as 200 with processing status
            const { prediction_id, message: acceptanceMessage } = autoClassifiedData;
            
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
      setFeedback({ 
        type: 'error', 
        message: error.message?.includes('mapping') || error.message?.includes('validation') 
          ? error.message 
          : errorHandler.message
      });
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
    setIsProcessing(true);
    setFeedback({ type: 'processing', message: 'Writing validated transactions to your sheet...' });
    
    const validated = validationTransactions.filter(t => t.isValidated);

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
          transactions: validated,
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