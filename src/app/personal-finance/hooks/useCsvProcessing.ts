
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import Papa from 'papaparse';
import { parse, isValid, format } from 'date-fns';
import posthog from 'posthog-js';

import { validateClassifyRequest, handleClassifyError } from '@/lib/classify-validation';
import { detectDuplicateTransactions } from '../utils/transactionUtils';
import { AnalysisResult, ImportConfig } from '../components/data-management/UploadCSVTab';
import { ValidationTransaction } from '../components/data-management/ValidateTransactionsTab';

const commonDateFormats = [
    { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS (e.g., 2023-12-31 14:30:00)' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (e.g., 2023-12-31)' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (e.g., 12/31/2023)' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (e.g., 31/12/2023)' },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (e.g., 31.12.2023)' },
    { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD (e.g., 2023/12/31)' },
];

type MappableFields = 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'direction' | 'none';

interface UseCsvProcessingProps {
  onValidationReady: (transactions: ValidationTransaction[]) => void;
  onClose: () => void;
  spreadsheetLinked: boolean;
}

export const useCsvProcessing = ({
  onValidationReady,
  onClose,
  spreadsheetLinked,
}: UseCsvProcessingProps) => {
  const { data: session } = useSession();
  const { userData, updateBaseCurrency } = usePersonalFinanceStore();
  const baseCurrency = userData.baseCurrency || 'USD';

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [config, setConfig] = useState<Partial<ImportConfig>>({
    mappings: {},
    dateFormat: commonDateFormats[3].value,
    amountFormat: 'standard',
    skipRows: 0,
  });
  const [csvStep, setCsvStep] = useState<'upload' | 'configure' | 'ready'>('upload');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'processing'; message: string } | null>(null);
  const [duplicateReport, setDuplicateReport] = useState<any>(null);
  const [suggestionReasoning, setSuggestionReasoning] = useState<string | null>(null);


  const handleAnalyze = async (selectedFile: File) => {
    setUploadedFile(selectedFile);
    setIsProcessing(true);
    setFeedback({ type: 'processing', message: 'Analyzing CSV file...' });

    Papa.parse(selectedFile, {
      header: false, // Important: we'll handle headers manually
      skipEmptyLines: true,
      preview: 5,
      complete: async (results) => {
        const rawData = results.data as string[][];
        
        if (rawData.length === 0) {
          setFeedback({ type: 'error', message: 'The CSV is empty or not properly formatted.' });
          setIsProcessing(false);
          return;
        }

        const headers = rawData[0];
        const sampleRows = rawData.slice(1);

        const sampleRowsForApi = sampleRows.map(row => {
          const rowObject: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index];
          });
          return rowObject;
        });

        let hasHeaders = false;

        try {
          const response = await fetch('/api/csv/suggest-mappings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headers, sampleRows: sampleRowsForApi }),
          });

          if (response.ok) {
            const suggestions = await response.json();
            console.log('AI Suggestions:', suggestions);
            
            setSuggestionReasoning(suggestions.reasoning || null);

            hasHeaders = suggestions.hasHeaders;

            setConfig(prev => ({
              ...prev,
              mappings: suggestions.suggestions,
              skipRows: suggestions.hasHeaders ? 1 : 0,
              dateFormat: suggestions.dateFormat || prev.dateFormat,
            }));
            
            setFeedback({ type: 'info', message: 'AI mapping suggestions applied.' });
          } else {
            throw new Error('AI suggestion failed, falling back to basic mapping.');
          }
        } catch (error) {
          console.error('Mapping suggestion error:', error);
          setFeedback({ type: 'info', message: 'Could not get AI suggestions. Using basic mapping.' });
          
          const commonMappings: { [key in 'date' | 'description' | 'amount']: string[] } = {
              date: ['date', 'timestamp', 'transaction date'],
              description: ['description', 'details', 'narrative', 'payee'],
              amount: ['amount', 'value', 'total'],
          };
          
          const initialMappings: Record<string, MappableFields> = {};

          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            for (const field in commonMappings) {
              if (commonMappings[field as 'date' | 'description' | 'amount'].some(keyword => lowerHeader.includes(keyword))) {
                initialMappings[header] = field as MappableFields;
                break;
              }
            }
          });
          setConfig(prev => ({ ...prev, mappings: initialMappings }));
          hasHeaders = true; // Fallback assumption
        }


        const previewData = (hasHeaders ? rawData.slice(1) : rawData).slice(0, 5).map(row => {
          let obj: Record<string, any> = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });

        setAnalysisResult({ headers, previewRows: previewData, detectedDelimiter: results.meta.delimiter || ',' });
        
        setCsvStep('configure');
        // Keep feedback from AI suggestion if it exists
        if (!feedback) setFeedback(null);
        setIsProcessing(false);
      },
      error: (error) => {
        setFeedback({ type: 'error', message: `Error parsing CSV: ${error.message}` });
        setIsProcessing(false);
      }
    });
  };

  const handleMappingChange = (csvHeader: string, fieldType: MappableFields | null) => {
    setConfig(prev => {
      const newMappings = { ...prev.mappings };
      if (fieldType) {
        newMappings[csvHeader] = fieldType;
      } else {
        delete newMappings[csvHeader];
      }
      return { ...prev, mappings: newMappings };
    });
  };

  const validateAndProcessData = async () => {
    if (!uploadedFile || !analysisResult) return;

    setIsProcessing(true);
    setFeedback({ type: 'processing', message: 'Processing your data...' });

    const requiredFields: MappableFields[] = ['date', 'description', 'amount'];
    const mappedFields = Object.values(config.mappings || {});
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

    if (missingFields.length > 0) {
      setFeedback({ type: 'error', message: `Missing required fields: ${missingFields.join(', ')}` });
      setIsProcessing(false);
      return;
    }

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let parsedData = (results.data as Record<string, string>[])
          .slice(config.skipRows || 0)
          .map((row, index) => {
            const transaction: any = { id: `csv-${Date.now()}-${index}` };
            for (const header in config.mappings) {
              const fieldType = config.mappings[header];
              if (fieldType && fieldType !== 'none') {
                transaction[fieldType] = row[header];
              }
            }
            return transaction;
          });

        // Standardize date format before duplicate detection
        if (config.dateFormat) {
          parsedData.forEach(tx => {
            if (tx.date) {
              const parsedDate = parse(tx.date, config.dateFormat!, new Date());
              if (isValid(parsedDate)) {
                tx.date = format(parsedDate, 'yyyy-MM-dd');
              } else {
                console.warn(`Invalid date found: ${tx.date} with format ${config.dateFormat}`);
              }
            }
          });
        }

        const { uniqueTransactions, duplicates } = detectDuplicateTransactions(parsedData, userData.transactions || []);
        
        if (duplicates.length > 0) {
            setDuplicateReport({
              newCount: parsedData.length,
              existingCount: (userData.transactions || []).length,
              duplicateCount: duplicates.length,
              duplicates: duplicates,
            });
        }
        
        if (uniqueTransactions.length === 0) {
            setFeedback({ type: 'info', message: 'No new transactions found to import.' });
            setIsProcessing(false);
            return;
        }

        const requestBody = {
            transactions: uniqueTransactions,
            user_id: session?.user.id,
            is_first_time_user: !spreadsheetLinked,
            file_name: uploadedFile.name,
            source: 'csv-import'
        };
        
        try {
            validateClassifyRequest(requestBody);
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message });
            setIsProcessing(false);
            return;
        }

        const makeRequestWithRetry = async (requestFn: () => Promise<Response>, maxRetries = 2): Promise<Response> => {
            let attempts = 0;
            while (attempts < maxRetries) {
                try {
                    const response = await requestFn();
                    if (response.ok) return response;
                    if (response.status >= 500 && attempts < maxRetries -1) {
                        attempts++;
                        await new Promise(res => setTimeout(res, 1000 * attempts));
                        continue;
                    }
                    return response;
                } catch (error) {
                    attempts++;
                    if (attempts >= maxRetries) throw error;
                    await new Promise(res => setTimeout(res, 1000 * attempts));
                }
            }
            throw new Error("Max retries reached");
        };

        const processResponse = async (response: Response, uniqueTxs: any[]) => {
            const data = await response.json();
            if (!response.ok) {
                const errorDetails = handleClassifyError(data);
                setFeedback({ type: 'error', message: errorDetails.message });
                setIsProcessing(false);
                return;
            }

            posthog.capture('pf_csv_processed', { 
                transaction_count: uniqueTxs.length,
                is_first_time: !spreadsheetLinked,
            });

            if (data.prediction_id) {
                setFeedback({ type: 'info', message: `✅ Request submitted! Now processing your ${uniqueTxs.length} transactions...` });
                await pollForCompletion(data.prediction_id, 'auto_classification', 
                    (results) => handleAutoClassificationComplete(results, uniqueTxs),
                    (error) => setFeedback({ type: 'error', message: `Auto-classification failed: ${error}` })
                );
            } else if (data.categorized_transactions) {
                handleAutoClassificationComplete(data, uniqueTxs);
            } else {
                setFeedback({ type: 'error', message: 'Received an unexpected response from the server.' });
                setIsProcessing(false);
            }
        };

        try {
            const response = await makeRequestWithRetry(() => 
              fetch('/api/classify/auto-classify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody)
              })
            );
            await processResponse(response, uniqueTransactions);

        } catch (error) {
            setFeedback({ type: 'error', message: error instanceof Error ? error.message : "An unknown error occurred" });
            setIsProcessing(false);
        }
      },
       error: (error) => {
        setFeedback({ type: 'error', message: `Error processing CSV: ${error.message}` });
        setIsProcessing(false);
      }
    });
  };

  const pollForCompletion = async (
    predictionId: string,
    operationType: 'training' | 'classification' | 'auto_classification',
    onSuccess: (results?: any) => void,
    onError: (message: string) => void
  ) => {
    const maxPolls = 120;
    const pollInterval = 5000;
    let pollCount = 0;

    const executePoll = async () => {
      while (pollCount < maxPolls) {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const pollingUrl = `/api/classify/status?job_id=${predictionId}&type=${operationType}`;

        try {
          const response = await fetch(pollingUrl);
          if (!response.ok) {
            if (pollCount > 3) throw new Error(`Status endpoint error: ${response.status} ${response.statusText}`);
            setFeedback({ type: 'info', message: `🔄 Retrying status check...` });
            continue;
          }

          const data = await response.json();

          if (data.status === 'completed') {
            const finalResults = data.results || (data.fullPredictionStatus ? data.fullPredictionStatus.results : null);
            if (!finalResults) throw new Error('Polling completed, but no results found.');
            const finalData = {
                categorized_transactions: finalResults,
                base_currency: data.fullPredictionStatus?.processing_info?.base_currency,
                duplicate_report: data.fullPredictionStatus?.duplicate_report
            };
            await onSuccess(finalData);
            return;
          } else if (data.status === 'failed' || data.status === 'error') {
            onError(data.error || data.message || 'Job failed');
            return;
          } else {
            setFeedback({ type: 'info', message: `🔄 Processing continues... (Status: ${data.status})` });
          }
        } catch (error) {
          if (pollCount >= maxPolls / 2) {
            onError(error instanceof Error ? error.message : `Polling failed for job ${predictionId}.`);
            return;
          }
        }
      }
      onError(`Job timed out after ${maxPolls} attempts.`);
    };
    
    await executePoll();
  };

  const handleAutoClassificationComplete = async (autoClassifiedData: any, uniqueTransactions: any[]) => {
    try {
      if (!autoClassifiedData || !autoClassifiedData.categorized_transactions) {
        throw new Error("Invalid auto-classification data.");
      }

      const categorized = autoClassifiedData.categorized_transactions;
      const newBaseCurrency = autoClassifiedData.base_currency || baseCurrency;
      if (newBaseCurrency !== baseCurrency) {
        updateBaseCurrency(newBaseCurrency);
      }
      
      if (autoClassifiedData.duplicate_report) {
        setDuplicateReport(autoClassifiedData.duplicate_report);
      }

      const transformedForValidation: ValidationTransaction[] = categorized.map((t: any, i: number) => {
        const originalTx = uniqueTransactions[i] || {};
        
        // The date now comes from the original transaction, which is already formatted.
        const formattedDate = originalTx.date || '';

        return {
          id: originalTx.id || `val-${Date.now()}-${i}`,
          date: formattedDate,
          description: t.narrative || originalTx.description || '',
          category: t.predicted_category,
          subCategory: t.predicted_sub_category,
          amount: Math.abs(parseFloat(String(t.amount || '0'))),
          isDebit: !t.money_in,
          confidence: t.similarity_score,
          currency: originalTx.currency || newBaseCurrency,
          source: 'csv',
          isNew: true,
          isValidated: false,
          errors: [],
          originalData: originalTx,
          baseCurrency: newBaseCurrency,
          originalCurrency: t.currency || originalTx.currency
        };
      });

      onValidationReady(transformedForValidation);
      setFeedback({ type: 'success', message: 'Your transactions are ready for validation!' });
      setCsvStep('ready');
      setIsProcessing(false);
    } catch (error) {
      setFeedback({ type: 'error', message: `Error processing results: ${error instanceof Error ? error.message : String(error)}` });
      setIsProcessing(false);
    }
  };

  const resetCsvState = useCallback(() => {
    setUploadedFile(null);
    setIsProcessing(false);
    setAnalysisResult(null);
    setConfig({
        mappings: {},
        dateFormat: commonDateFormats[3].value,
        amountFormat: 'standard',
        skipRows: 0,
    });
    setCsvStep('upload');
    setFeedback(null);
    setDuplicateReport(null);
  }, []);

  return {
    // State
    uploadedFile,
    isProcessing,
    analysisResult,
    config,
    csvStep,
    feedback,
    duplicateReport,
    suggestionReasoning,

    // Actions
    handleAnalyze,
    handleMappingChange,
    setConfig,
    validateAndProcessData,
    resetCsvState,
    setDuplicateReport,
  };
}; 