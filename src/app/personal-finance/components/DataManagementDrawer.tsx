'use client';

import React, { useState } from 'react';
import { SpreadsheetLinker } from './SpreadsheetLinker';
import { GoogleSheetsUploadArea } from './GoogleSheetsUploadArea';
import { CSVUploadArea } from '../shared/CSVUploadArea';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { parseTransactionDate } from '@/lib/utils';
import Papa from 'papaparse';
import { 
  DocumentPlusIcon, 
  LinkIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  LightBulbIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface DataManagementDrawerProps {
  spreadsheetLinked: boolean;
  spreadsheetUrl: string | null;
  onSpreadsheetLinked: (data: { spreadsheetId: string; spreadsheetUrl: string }) => void;
  onTransactionsFromGoogleSheets: (transactions: any[]) => void;
  onRefreshData: () => void;
  onAddNewData: () => void;
  isLoading: boolean;
  onClose: () => void;
}

type TabType = 'link' | 'upload' | 'manage' | 'validate';
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

interface ValidationTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
  predicted_category?: string;
  similarity_score?: number;
  confidence?: number;
  isValidated?: boolean;
  isSelected?: boolean;
  [key: string]: any;
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

const DataManagementDrawer: React.FC<DataManagementDrawerProps> = ({
  spreadsheetLinked,
  spreadsheetUrl,
  onSpreadsheetLinked,
  onTransactionsFromGoogleSheets,
  onRefreshData,
  onAddNewData,
  isLoading,
  onClose
}) => {
  const { userData, processTransactionData } = usePersonalFinanceStore();
  const [activeTab, setActiveTab] = useState<TabType>(spreadsheetLinked ? 'manage' : 'link');
  
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Validation state
  const [validationTransactions, setValidationTransactions] = useState<ValidationTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showOnlyUnvalidated, setShowOnlyUnvalidated] = useState(true);

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
      let initialMappings = result.headers.reduce((acc: Record<string, MappedFieldType>, header: string) => {
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
      const uniqueAutoAssignFields: MappedFieldType[] = ['date', 'amount', 'currency', 'description', 'description2'];
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

  const handleMappingChange = (csvHeader: string, fieldType: MappedFieldType) => {
    setConfig(prevConfig => {
      const newMappings = { ...prevConfig.mappings };

      const uniqueFields: MappedFieldType[] = ['date', 'amount', 'currency', 'description', 'description2'];
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
    setCsvStep('ready');
    
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
      const rawTransactions = processedData.map((row, index) => {
        const dateHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'date');
        const amountHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'amount');
        const descriptionHeader = Object.keys(config.mappings!).find(h => config.mappings![h] === 'description');
        
        const originalAmount = parseFloat(String(row[amountHeader!] || '0'));
        
        // Parse and format the date properly to avoid timezone issues
        const rawDate = row[dateHeader!] || new Date().toISOString().split('T')[0];
        const parsedDate = parseTransactionDate(String(rawDate));
        const formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        return {
          id: `transaction-${index}`,
          date: formattedDate,
          description: String(row[descriptionHeader!] || 'Unknown'),
          amount: Math.abs(originalAmount),
          account: 'Uploaded CSV',
          isDebit: originalAmount < 0,
          money_in: originalAmount > 0, // For ML categorization API
        };
      });

      // Filter out duplicate transactions early
      const uniqueTransactions = filterDuplicateTransactions(rawTransactions);
      const duplicateCount = rawTransactions.length - uniqueTransactions.length;

      if (uniqueTransactions.length === 0) {
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
          message: `Processing ${uniqueTransactions.length} new transactions. Starting categorization...` 
        });
      }

      // Step 1: Check if we have existing data for training or use generic classification
      const hasExistingData = userData.transactions && userData.transactions.length > 0;
      
      if (hasExistingData) {
        // Subsequent upload - use custom model training + classification
        setFeedback({ type: 'success', message: 'Training custom model on your existing data...' });
        
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

        if (!trainResponse.ok) {
          throw new Error('Failed to train custom model on existing data');
        }

        setFeedback({ type: 'success', message: 'Model trained! Now categorizing new transactions...' });

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

        if (!classifyResponse.ok) {
          throw new Error('Failed to classify transactions with custom model');
        }

        const classifiedData = await classifyResponse.json();
        
        // Transform classified results back to full transaction format
        const categorizedTransactions = classifiedData.results.map((result: any, index: number) => ({
          ...uniqueTransactions[index],
          id: `transaction-${index}`,
          category: result.predicted_category || 'Uncategorized',
          predicted_category: result.predicted_category,
          similarity_score: result.similarity_score,
          confidence: result.confidence || 0,
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
        // First upload - use generic auto-classify
        setFeedback({ type: 'success', message: 'Using generic auto-classification for first upload...' });
        
        const autoClassifyResponse = await fetch('/auto-classify', {
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

        if (!autoClassifyResponse.ok) {
          throw new Error('Failed to auto-classify transactions');
        }

        const autoClassifiedData = await autoClassifyResponse.json();
        
        // Transform auto-classified results back to full transaction format
        const categorizedTransactions = autoClassifiedData.results.map((result: any, index: number) => ({
          ...uniqueTransactions[index],
          id: `transaction-${index}`,
          category: result.predicted_category || 'Uncategorized',
          predicted_category: result.predicted_category,
          confidence: result.confidence || 0,
          isValidated: false,
          isSelected: false,
          account: 'Imported'
        }));

        setValidationTransactions(categorizedTransactions);
        setActiveTab('validate');
        setFeedback({ 
          type: 'success', 
          message: `Auto-classified ${categorizedTransactions.length} transactions using generic model. Please review and validate!` 
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

  const handleCompleteValidation = async () => {
    const validatedTransactions = validationTransactions.filter(t => t.isValidated);
    
    if (validatedTransactions.length === 0) {
      setFeedback({ type: 'error', message: 'Please validate at least one transaction before completing.' });
      return;
    }

    setIsProcessing(true);
    setFeedback({ type: 'info', message: 'Writing transactions to Google Sheet...' });

    try {
      // Update the store with validated transactions
      processTransactionData(validatedTransactions);

      // If user has a spreadsheet, append the validated transactions
      if (userData.spreadsheetId && validatedTransactions.length > 0) {
        const response = await fetch('/api/sheets/append-validated-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: validatedTransactions,
            spreadsheetId: userData.spreadsheetId
          })
        });

        if (response.ok) {
          const result = await response.json();
          setFeedback({ 
            type: 'success', 
            message: `Successfully wrote ${result.appendedCount} transactions to Google Sheet!` 
          });
          
          // Close drawer and navigate back to dashboard
          setTimeout(() => {
            onClose();
            window.location.href = '/personal-finance'; // Navigate to dashboard
          }, 2000);
        } else {
          throw new Error('Failed to append transactions to spreadsheet');
        }
      } else {
        throw new Error('No spreadsheet linked');
      }
    } catch (error: any) {
      console.error('Error completing validation:', error);
      setFeedback({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(new Set(validationTransactions.map(t => t.category))).sort();

  // Filter and sort validation transactions
  const filteredValidationTransactions = validationTransactions
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

  const validatedCount = validationTransactions.filter(t => t.isValidated).length;
  const totalValidationCount = validationTransactions.length;
  const progressPercentage = totalValidationCount > 0 ? (validatedCount / totalValidationCount) * 100 : 0;

  const getConfidenceColor = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'link'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LinkIcon className="h-5 w-5 inline mr-2" />
            Link Google Sheet
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentPlusIcon className="h-5 w-5 inline mr-2" />
            Upload CSV
          </button>

          {spreadsheetLinked && (
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
          )}

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
              Validate ({validatedCount}/{totalValidationCount})
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Link a Google Spreadsheet</p>
                  <p>Connect your existing Google Sheets or create a new one from our template. This will become your primary data source for the dashboard.</p>
                </div>
              </div>
            </div>
            
            <SpreadsheetLinker
              onSuccess={onSpreadsheetLinked}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Upload CSV Data</p>
                  <p>Import transaction data from CSV files. Data will be processed and categorized automatically.</p>
                </div>
              </div>
            </div>

            {/* Last Transaction Info */}
            {lastTransaction ? (
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
            )}

            {/* CSV Upload and Configuration */}
            {csvStep === 'upload' && (
              <CSVUploadArea onFileSelect={handleFileSelect} />
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

            {/* Feedback Messages */}
            {feedback && (
              <div className={`p-4 rounded-lg border ${
                feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {feedback.type === 'success' ? '✅' : feedback.type === 'error' ? '❌' : '⚠️'}
                  </span>
                  <div className="font-medium">{feedback.message}</div>
                </div>
              </div>
            )}

            {/* CSV Configuration */}
            {analysisResult && csvStep === 'configure' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-800">Configure Your Data Import</h4>
                
                {/* Preview Table */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Preview</h5>
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
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Map Your Columns</h5>
                  <div className="space-y-3">
                    {analysisResult.headers.map((header, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{header}</div>
                          <div className="text-xs text-gray-600">
                            Sample: {String(analysisResult.previewRows[0]?.[header] || 'N/A')}
                          </div>
                        </div>
                        <select
                          value={config.mappings?.[header] || 'none'}
                          onChange={(e) => handleMappingChange(header, e.target.value as MappedFieldType)}
                          className="ml-4 w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  onClick={validateAndProcessData}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Process Transactions'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && spreadsheetLinked && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Data Source Connected</p>
                  <p>Your Google Spreadsheet is linked and ready. You can refresh data, change the linked sheet, or upload additional CSV data.</p>
                </div>
              </div>
            </div>

            {/* Current Spreadsheet Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Data Source</h4>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Google Spreadsheet</p>
                  {spreadsheetUrl && (
                    <p className="text-xs text-gray-500 mt-1 break-all">
                      {spreadsheetUrl}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onRefreshData}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </button>
                  <a
                    href={spreadsheetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Open Sheet
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('link')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <LinkIcon className="h-6 w-6 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">Change Spreadsheet</h4>
                <p className="text-sm text-gray-600">Link a different Google Sheet</p>
              </button>
              
              <button
                onClick={() => setActiveTab('upload')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <DocumentPlusIcon className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-medium text-gray-900">Add CSV Data</h4>
                <p className="text-sm text-gray-600">Import additional transactions</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'validate' && validationTransactions.length > 0 && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Validation Progress</span>
                <span className="text-sm text-blue-600">{validatedCount} of {totalValidationCount} completed</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Validation Controls */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {selectedTransactions.size === filteredValidationTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedTransactions.size > 0 && (
                    <button
                      onClick={handleValidateSelected}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Validate Selected ({selectedTransactions.size})
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyUnvalidated}
                    onChange={(e) => setShowOnlyUnvalidated(e.target.checked)}
                    className="rounded"
                  />
                  Show only unvalidated
                </label>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="all">All categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="confidence">Confidence</option>
                    <option value="amount">Amount</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Complete Validation Button */}
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={handleCompleteValidation}
                  disabled={validatedCount === 0 || isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Writing to Google Sheet...' : `Complete Validation (${validatedCount} transactions)`}
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.size === filteredValidationTransactions.length && filteredValidationTransactions.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredValidationTransactions.map((transaction, index) => (
                      <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={(e) => handleTransactionSelect(transaction.id, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={transaction.isDebit ? 'text-red-600' : 'text-green-600'}>
                            {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {editingTransaction === transaction.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded flex-1"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditCategory(transaction.id, editCategory)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingTransaction(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900">{transaction.category}</span>
                              <button
                                onClick={() => startEditingCategory(transaction)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                            {getConfidenceText(transaction.confidence)} ({Math.round((transaction.confidence || 0) * 100)}%)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {transaction.isValidated ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Validated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!transaction.isValidated && (
                            <button
                              onClick={() => handleValidateTransaction(transaction.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Validate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagementDrawer; 