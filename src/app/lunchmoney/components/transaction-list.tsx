'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import { 
  Transaction, 
  Category, 
  ToastMessage, 
  OperationType 
} from './types';

// Import components
import ProgressModal from './progress-modal';
import TransactionFilters from './transaction-filters';
import CategorizationControls from './categorization-controls';
import TransactionTable from './transaction-table';
import ToastNotification from './toast-notification';
import { Switch } from '@headlessui/react';
import { useLunchMoneyData } from '../hooks/useLunchMoneyData'; // Import the hook

// Define type here now
type TransactionStatusFilter = 'uncleared' | 'cleared';

const EXPENSE_SORTED_TRAINED_TAG = 'expense-sorted-trained';

export default function TransactionList() {
  // === Use the Custom Hook ===
  const {
    dateRange,
    pendingDateRange,
    statusFilter,
    isApplyingDates,
    isTrainingInBackground,
    transactions,
    isLoadingTransactions,
    transactionError, // Use this error for display if needed
    countsData,
    isLoadingCounts,
    countsError,
    categories,
    isLoadingCategories, // Use this for display if needed
    categoriesError, // Use this for display if needed
    lastTrainedTimestamp,
    isLoadingTimestamp, // Use this for display if needed
    timestampError, // Use this for display if needed
    handleDateRangeChange,
    applyDateFilter,
    setStatusFilter,
    startBackgroundTraining, // Use this function
    stopBackgroundTraining // Use this function
  } = useLunchMoneyData();
  // =========================

  // Get QueryClient instance
  const queryClient = useQueryClient();

  // === Component State (Keep state not managed by the hook) ===
  const [loading, setLoading] = useState(true); // Keep local loading for overall component?
  const [error, setError] = useState<string | null>(null); // Keep local generic error state?
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  const [operationInProgress, setOperationInProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<OperationType>('none');
  const [isOperationComplete, setIsOperationComplete] = useState(false); 
  const [isTagging, setIsTagging] = useState(false); 
  const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Record<string, {categoryId: string | null, score: number}>>({});
  const [applyingAll, setApplyingAll] = useState<boolean>(false);
  const [applyingIndividual, setApplyingIndividual] = useState<string | null>(null);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null); 
  const [isTransferringPayees, setIsTransferringPayees] = useState(false); 
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [filterNoPayee, setFilterNoPayee] = useState(false);
  // ==========================================================

  // Remove state managed by hook: 
  // statusFilter, pendingDateRange, dateRange, isApplyingDates, isTrainingInBackground, expectedTrainCount

  // Remove fetch functions managed by hook: 
  // fetchTransactionsWithDates, fetchTotalCounts, fetchCategories, fetchLastTrainedTimestamp, fetchAllReviewedForTagging

  // Remove useQuery calls managed by hook: 
  // transactions, counts, categories, timestamp

  // Remove effects managed by hook: 
  // Polling effect, initial fetch effect

  // Update local loading/error based on hook states
  useEffect(() => {
      // Combine loading states from hook for a general loading indicator
      const overallLoading = isLoadingTransactions || isLoadingCounts || isLoadingCategories || isLoadingTimestamp;
      setLoading(overallLoading);
      // Combine errors or prioritize
      const overallError = transactionError || countsError || categoriesError || timestampError;
      setError(overallError ? overallError.message : null);
  }, [isLoadingTransactions, isLoadingCounts, isLoadingCategories, isLoadingTimestamp, transactionError, countsError, categoriesError, timestampError]);

  // Auto-hide toast effect (Keep)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Calculate uncategorizedCount locally from hook's transactions
  const transactionStats = useMemo(() => {
    let uncategorizedCount = 0;
    transactions.forEach(tx => {
      if (!tx.originalData?.category_id) {
        uncategorizedCount++;
      }
    });
    return { uncategorizedCount };
  }, [transactions]);

  // Displayed transactions calculation (Keep)
  const displayedTransactions = useMemo(() => {
    const listToFilter = transactions; // Use transactions from hook
    if (isAdminMode && filterNoPayee) {
      return listToFilter.filter(tx => tx.originalData?.payee === '[No Payee]'); 
    } 
    return listToFilter;
  }, [transactions, isAdminMode, filterNoPayee]);

  // Keep handleSelectTransaction, handleSelectAll, cancelSinglePrediction, handleCategoryChange, etc.
  // Ensure they use `transactions` and `categories` from the hook.

  // --- Example: Refactor handleSelectTransaction (Check if modification needed) --- 
  const handleSelectTransaction = useCallback((txId: string) => {
    if (!txId) {
      console.error("Attempted to select a transaction with no ID");
      return;
    }
    setSelectedTransactions(prev => {
      if (prev.includes(txId)) {
        return prev.filter(id => id !== txId);
      } else {
        return [...prev, txId];
      }
    });
  }, []); // Still only depends on setSelectedTransactions

  // --- Example: Refactor handleSelectAll (Use hook's transactions) --- 
  const handleSelectAll = useCallback(() => {
    if (transactions.length === 0) return; // Use transactions from hook
    const currentTransactionIds = transactions // Use transactions from hook
      .map(tx => tx.lunchMoneyId)
      .filter((id): id is string => id !== undefined && id !== null);
    const allCurrentSelected = currentTransactionIds.every(id => selectedTransactions.includes(id));
    if (allCurrentSelected && selectedTransactions.length > 0) {
      setSelectedTransactions(prev => prev.filter(id => !currentTransactionIds.includes(id)));
    } else {
      setSelectedTransactions(prev => {
        const newSelection = [...prev];
        currentTransactionIds.forEach(id => { if (!newSelection.includes(id)) { newSelection.push(id); } });
        return newSelection;
      });
    }
  }, [transactions, selectedTransactions]); // Add transactions dependency from hook

  // --- Keep other action handlers (cancelSinglePrediction, handleCategoryChange, etc.) ---
  // Ensure they use `transactions` and `categories` from the hook where necessary.
  const cancelSinglePrediction = useCallback((transactionId: string) => {
    console.log(`Cancelling prediction for transaction ${transactionId}`);
    setPendingCategoryUpdates(prev => {
      const { [transactionId]: _, ...rest } = prev; // Destructure to remove the key
      return rest;
    });
    // Optionally, clear any specific visual success state for this item if needed
    setSuccessfulUpdates(prev => {
      const { [transactionId]: _, ...rest } = prev;
      return rest;
    });
    setToastMessage({ message: 'Prediction discarded for this transaction.', type: 'info' });
  }, [setPendingCategoryUpdates, setSuccessfulUpdates, setToastMessage]); // Add dependencies
  
  // Define handleCategoryChange here
  const handleCategoryChange = useCallback(async (transactionId: string, categoryValue: string) => {
    setUpdatingCategory(transactionId);
    const transaction = transactions.find(tx => tx.lunchMoneyId === transactionId); // Use transactions from hook
    if (!transaction) {
      setUpdatingCategory(null);
      console.error("Transaction not found for category update:", transactionId);
      setToastMessage({ message: 'Transaction not found', type: 'error' });
      return;
    }

    // --- Note: Optimistic updates removed for simplicity with query invalidation --- 

    try {
      // Prepare data for API (handle 'none' category, maybe filter tags?)
      const txTags = transaction.tags || [];
      const filteredTags = txTags.filter(tag => 
          !(typeof tag === 'string' && tag.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG) && 
          !(typeof tag === 'object' && tag.name && tag.name.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG)
      );

      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryValue,
          tags: filteredTags, // Send filtered tags
          status: 'cleared'
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }

      // Invalidate queries to refetch data
      console.log(`[Category Change ${transactionId}] Invalidating transaction and count queries.`);
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts', dateRange] });
      // Potentially invalidate categories if this action could add one? Usually not.
      // queryClient.invalidateQueries({ queryKey: ['lunchMoneyCategories'] });

      setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: true }));
      setTimeout(() => setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: false })), 3000);

      setToastMessage({ message: responseData.message || 'Category updated successfully.', type: 'success' });

      // If manually changing category, cancel any pending prediction for this item
      if (pendingCategoryUpdates[transactionId]) {
        cancelSinglePrediction(transactionId); 
      }

    } catch (error) {
      console.error('Error updating category:', error);
      // --- Revert Optimistic Update on Error (Removed as we rely on invalidation) ---
      setError(error instanceof Error ? error.message : 'Failed to update category');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to update category', type: 'error' });
    } finally {
      setUpdatingCategory(null);
    }
  // Add dependencies: transactions, queryClient, dateRange, statusFilter, local state setters/values
  }, [transactions, queryClient, dateRange, statusFilter, pendingCategoryUpdates, cancelSinglePrediction, setToastMessage, setError, setUpdatingCategory, setSuccessfulUpdates]);

  // --- Keep tagging function here, as it's an action --- 
  const tagTransactionsAsTrained = useCallback(async (transactionsToPotentiallyTag: Transaction[]) => {
    if (!transactionsToPotentiallyTag.length) {
      console.log("[Tagging] No transaction objects provided.");
      return { successCount: 0, failCount: 0 };
    }
    console.log("[Tagging] Received transaction objects for potential tagging:", transactionsToPotentiallyTag);

    // 1. Filter based on current state BEFORE starting any API calls
    const filteredTransactionsForTagging = transactionsToPotentiallyTag.filter(tx => {
      if (!tx) {
        console.warn(`[Tagging] Filter: Received an undefined transaction object. Skipping.`); // Should ideally not happen
        return false; 
      }
      const txTags = tx.tags || [];
      const hasTrainedTag = txTags.some(tag => 
        (typeof tag === 'string' && tag.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG) || 
        (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG)
      );
      if (hasTrainedTag) {
        // This is not an error, just info
        // console.log(`[Tagging] Filter: Transaction ${txId} already has the tag.`); 
      }
      return !hasTrainedTag; // Keep only those needing the tag
    });

    // Extract the IDs from the filtered transactions
    const transactionsToTagIds = filteredTransactionsForTagging.map(tx => tx.lunchMoneyId).filter(id => !!id);
    console.log(`[Tagging] After filtering: ${transactionsToTagIds.length} transactions actually need tagging.`, transactionsToTagIds);

    if (transactionsToTagIds.length === 0) {
      console.log(`[Tagging] No transactions require tagging.`);
      return { successCount: 0, failCount: 0 }; 
    }

    // 2. Process the filtered list in batches
    try {
      const batchSize = 10; // Adjust batch size if needed
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = [];
      
      console.log(`[Tagging] Starting batch processing (Size: ${batchSize})...`);
      for (let i = 0; i < transactionsToTagIds.length; i += batchSize) {
        const batchIds = transactionsToTagIds.slice(i, i + batchSize);
        const batchNumber = i / batchSize + 1;
        console.log(`[Tagging] Preparing Batch ${batchNumber} (IDs: ${batchIds.join(', ')})`);

        // Create fetch promises for the current batch
        const batchPromises = batchIds.map(transactionId => 
          fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId,
              tags: [EXPENSE_SORTED_TRAINED_TAG] 
            }),
          }).then(async response => { 
            if (!response.ok) {
              const errorBody = await response.text().catch(() => 'Failed to read error body');
              throw new Error(`API Error ${response.status} for TxID ${transactionId}: ${errorBody}`); 
            }
            return { transactionId, responseData: await response.json() }; 
          })
        );

        // Run batch promises concurrently
        console.log(`[Tagging] Executing Batch ${batchNumber}...`);
        const startTime = Date.now();
        const batchResults = await Promise.allSettled(batchPromises);
        const endTime = Date.now();
        console.log(`[Tagging] Batch ${batchNumber} finished in ${endTime - startTime}ms.`);

        // Process results for the batch
        batchResults.forEach((result, index) => {
          const transactionId = batchIds[index]; 
          if (result.status === 'fulfilled') {
            // console.log(`[Tagging] Batch Result: OK for ${transactionId}`);
            successCount++;
            successfulTxIds.push(transactionId);
          } else {
            console.error(`[Tagging] Batch Result: FAIL for ${transactionId}. Reason:`, result.reason?.message || result.reason);
            failCount++;
          }
        });
        
        // Optional delay between batches if rate limiting is still an issue
        // if (i + batchSize < transactionsToTag.length) {
        //   console.log(`[Tagging] Pausing briefly before next batch...`);
        //   await new Promise(resolve => setTimeout(resolve, 200)); 
        // }
      }
      
      // INSTEAD: Invalidate queries to refetch data
      if (successCount > 0) {
          console.log("[Tagging] Invalidating transaction and count queries after tagging.");
          queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });
          queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts', dateRange] });
          // Also invalidate timestamp if tagging updates it (depends on backend)
          // queryClient.invalidateQueries({ queryKey: ['lastTrainedTimestamp'] });
      }
      
      console.log(`[Tagging] All batches completed. Overall Success: ${successCount}, Fail: ${failCount}`);
      return { successCount, failCount };

    } catch (error) {
      console.error('[Tagging] Error during batch processing loop:', error);
      return { successCount: 0, failCount: transactionsToPotentiallyTag.length }; 
    }
  }, [queryClient, dateRange, statusFilter]); 

  // Keep pollForCompletion - needed by handleTrainSelected and handleCategorizeSelected 
  // (Though handleTrainAllReviewed doesn't use it anymore)
  const pollForCompletion = useCallback(async (predictionId: string, type: 'training' | 'categorizing'): Promise<{ status: string; message?: string }> => {
    const maxPolls = 120; 
    const pollInterval = 5000;
    let pollCount = 0;
    let result: { status: string; message?: string } = { status: 'unknown', message: 'Maximum polling attempts reached' };

    const poll = async (): Promise<void> => { // Mark inner poll as returning void
      if (pollCount >= maxPolls) {
        // Update result but don't return it here
        result = { status: 'timeout', message: 'Maximum polling attempts reached' };
        return; // Exit the recursive call
      }
      pollCount++;

      // Update progress message during polling (optional)
      setProgressMessage(`${type === 'training' ? 'Training' : 'Categorizing'} in progress... (Attempt ${pollCount}/${maxPolls})`);
      // Update percentage slightly to show activity (optional)
      setProgressPercent(prev => Math.min(95, prev + 5)); 

      try {
        const response = await fetch('/api/classify/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ predictionId, type }),
        });

        if (!response.ok) {
          // If polling fails, wait and retry
          console.error(`Polling failed (Attempt ${pollCount}): Status ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          await poll(); // Retry
          return;
        }

        const data = await response.json();
        if (data.status === 'completed') {
          result = { status: 'completed', message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!` };
          // Don't set operationInProgress false here
          return; // Exit the recursive call
        } else if (data.status === 'in-progress' || data.status === 'pending') {
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          await poll();
          return;
        } else {
          // Handle unexpected status (e.g., 'failed')
          console.error(`Polling received unexpected status: ${data.status}`);
          result = { status: data.status || 'failed', message: `Polling failed with status: ${data.status}` };
          return; // Exit the recursive call
        }
      } catch (error) {
        console.error(`Error during polling (Attempt ${pollCount}):`, error);
        // Wait and retry on network errors etc.
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        await poll(); // Retry
        return;
      }
    };

    await poll(); // Start the polling
    
    // DO NOT set operationInProgress here
    // setOperationInProgress(false);
    // setOperationType('none');
    
    return result; // Return the final status object
  }, [setProgressMessage, setProgressPercent]); // Add dependencies for state setters used inside

  // Keep updateTransactionsWithPredictions
  const updateTransactionsWithPredictions = useCallback((results: any[]) => {
    if (!results || results.length === 0) {
      console.log("No results to update transactions with");
      return;
    }
    
    console.log(`Processing ${results.length} prediction results to update transactions`);
    console.log("Raw results:", JSON.stringify(results, null, 2));
    
    // Special case for the format shared in your error message
    // If we're getting a format like the example with narrative/predicted_category/similarity_score
    const hasCorrectFormat = results.length > 0 && 
      results[0] && 
      (results[0].narrative !== undefined && results[0].predicted_category !== undefined);
    
    if (hasCorrectFormat) {
      console.log("Results appear to be in the correct format already!");
    }
    
    // Create a new map for categorized transactions
    const newCategorizedTransactions = new Map();
    
    // Process results and build prediction map
    results.forEach((result, index) => {
      // The API might return results with different field names, so we handle both formats
      const narrative = result.narrative || result.Narrative || result.description || '';
      let predictedCategory = result.predicted_category || result.category || result.Category || '';
      const similarityScore = result.similarity_score || result.score || 0;
      
      // Skip "None" categories or replace with a fallback
      if (!predictedCategory || predictedCategory.toLowerCase() === 'none') {
        console.log(`Result ${index+1}: "${narrative}" → "None" category detected, using fallback`);
        predictedCategory = 'Uncategorized';
      }
      
      if (narrative && predictedCategory) {
        console.log(`Result ${index+1}: "${narrative}" → "${predictedCategory}" (${similarityScore})`);
        newCategorizedTransactions.set(narrative, {
          category: predictedCategory,
          score: similarityScore
        });
      } else {
        console.log(`Result ${index+1} is missing required fields:`, result);
      }
    });
    
    console.log("Built categorization map with", newCategorizedTransactions.size, "entries");
    
    // Clear any pending updates and set the new categorized transactions
    setPendingCategoryUpdates({});
    // Comment out removed state setter
    // setCategorizedTransactions(new Map());
    
    // Create a mapping of transaction IDs to predicted categories and scores for easier access
    const pendingUpdates: Record<string, {categoryId: string | null, score: number}> = {}; // Allow null categoryId

    // Map the predictions to transaction IDs
    selectedTransactions.forEach(txId => {
      const tx = transactions.find(t => t.lunchMoneyId === txId);
      if (tx && tx.description) {
        const prediction = newCategorizedTransactions.get(tx.description);
        
        if (prediction) {
          // Handle case where prediction is explicitly 'Uncategorized' (our fallback for 'None')
          if (prediction.category === 'Uncategorized') {
            pendingUpdates[txId] = {
              categoryId: null, // Use null to signify 'Needs Review' or 'Uncategorized'
              score: prediction.score
            };
          } else {
            // Find the category ID for this predicted category name
            const categoryObj = categories.find(cat => 
              typeof cat !== 'string' && 
              cat.name.toLowerCase() === prediction.category.toLowerCase()
            );
            
            // Use the found category ID or the category name as fallback if ID not found
            const categoryId = categoryObj && typeof categoryObj !== 'string' 
              ? categoryObj.id 
              : prediction.category; // Keep original prediction if ID mapping fails
            
            pendingUpdates[txId] = {
              categoryId,
              score: prediction.score
            };
          }
        } else {
            // Handle cases where a transaction was selected but received no prediction (e.g., API error for just that item)
            // Or if the 'None' category was filtered out earlier (ensure it's handled)
            // We might want to explicitly mark these for review as well
            console.log(`No prediction found for txId ${txId} with description "${tx.description}". Marking for review.`);
            pendingUpdates[txId] = {
              categoryId: null, // Mark as needing review
              score: 0 // Assign a zero score
            };
        }
      }
    });
    
    // Store the pending updates
    setPendingCategoryUpdates(pendingUpdates);
    
    console.log("Prepared", Object.keys(pendingUpdates).length, "pending category updates");
    
    // Show a success toast
    setToastMessage({
      message: `Categorized ${Object.keys(pendingUpdates).length} transactions. Review and apply the changes.`,
      type: 'success'
    });
  }, [transactions, categories, selectedTransactions]); // Dependencies: transactions, categories, selectedTransactions

  // Keep handleTrainSelected (Action handler)
  const handleTrainSelected = useCallback(async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({ message: "Please select at least one transaction for training", type: "error" });
      return;
    }

    if (selectedTransactions.length < 10) {
      setToastMessage({ message: "Please select at least 10 transactions for training (API requirement)", type: "error" });
      return;
    }

    setOperationInProgress(true);
    setOperationType('training');
    setProgressPercent(0);
    setProgressMessage('Preparing training data...');

    try {
      const trainingData = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId))
        .map(tx => {
          // Use category_id from originalData
          const categoryId = tx.originalData?.category_id?.toString() || null; // Get the numeric ID as string or null
          if (!categoryId) {
            console.warn(`Transaction ${tx.lunchMoneyId} is missing a category ID. Skipping for training or using fallback.`);
            // Decide: return null and filter out, or send a default like '0' or null
            // For now, let's send null if uncategorized, the backend needs to handle this.
          }
          return {
            description: tx.description,
            // Use Category (capital C) to match backend model
            Category: categoryId, // Send the numeric ID (or null)
            money_in: tx.is_income, 
            amount: tx.amount 
          };
        })
        // Optional: Filter out transactions without a category ID if the backend cannot handle null
        // .filter(item => item.categoryId !== null); 
      
      if (trainingData.length === 0) throw new Error('No valid transactions with category IDs selected for training');

      // Ensure payload structure matches expected backend (check if backend expects 'categoryId')
      const payload = {
        transactions: trainingData, // Contains description, categoryId, money_in, amount
        // Assuming backend might expect these, adjust if necessary
        expenseSheetId: 'lunchmoney', 
        spreadsheetId: 'lunchmoney' 
      };

      setProgressPercent(10);
      setProgressMessage('Sending training request...');

      // Make sure the backend API '/api/classify/train' forwards this payload,
      // and the *external* Flask service expects 'categoryId'
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // === START 403 HANDLING ===
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
        console.error('Training failed due to inactive subscription:', errorData);
        setToastMessage({ message: errorData.error || 'Training failed: Subscription inactive or trial expired.', type: 'error' });
        setError(errorData.error || 'Subscription inactive or trial expired.');
        setOperationInProgress(false);
        setOperationType('none');
        setProgressPercent(0); // Reset progress
        setProgressMessage('');
        return; // Stop further processing
      }
      // === END 403 HANDLING ===

      // --- MODIFIED RESPONSE HANDLING FOR TRAINING --- 
      let pollResult: { status: string; message?: string } = { status: 'unknown', message: 'Polling did not complete' }; 
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous training results:", syncResult);

        if (syncResult.status === 'completed') {
          // --- Simplified Flow --- 
          // 1. Show immediate success in modal
          setProgressMessage('Training completed successfully!');
          setProgressPercent(100);
          setIsOperationComplete(true); // Show Close button now
          setIsTagging(false); // Ensure tagging state is off for modal visuals

          // *** ADD PRE-FILTER LOGGING HERE ***
          console.log("[handleTrainSelected] Preparing for background tagging...");
          // Get the full transaction objects for tagging
          const selectedTxObjectsForTagging = transactions.filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
          // Log details of first few selected transactions before filtering
          if (selectedTxObjectsForTagging.length > 0) {
            console.log(`[handleTrainSelected] Checking tags for ${selectedTxObjectsForTagging.length} selected transactions. Sample:`);
            selectedTxObjectsForTagging.slice(0, 3).forEach(tx => {
              console.log(` - ID: ${tx.lunchMoneyId}, Tags:`, tx?.tags);
            });
          }
          // *** END PRE-FILTER LOGGING ***

          // 2. Perform tagging in background (fire and forget style, but handle result with toast)
          tagTransactionsAsTrained(selectedTxObjectsForTagging).then(tagResult => {
            // This runs after tagging attempt finishes
            // fetchLastTrainedTimestamp(); // REMOVE direct call
            queryClient.invalidateQueries({ queryKey: ['lastTrainedTimestamp'] }); // Invalidate instead
            setToastMessage({ 
              message: `Tagging complete: ${tagResult?.successCount || 0} updated${(tagResult?.failCount || 0) > 0 ? `, ${tagResult?.failCount} failed` : ''}.`,
              type: (tagResult?.failCount) > 0 ? 'error' : 'success' 
            });
            // Clear selection *after* toast related to tagging
            setSelectedTransactions([]); 
          }).catch(taggingError => {
            // Handle potential errors from the tagging promise itself
            console.error("[Tagging] Error after training completion:", taggingError);
            setToastMessage({ message: 'Error occurred during background tagging.', type: 'error' });
            setSelectedTransactions([]); // Still clear selection
          });
          
          // Return success for the training operation itself
          return { status: 'completed' }; 
        } else {
          // Handle unexpected 200 response format
          setIsOperationComplete(true); // Allow closing modal even on error
          throw new Error('Received unexpected success response format from server during training.');
        }
      } else if (response.status === 202) {
        // Asynchronous Processing Started
        const asyncResult = await response.json();
        console.log("Received asynchronous training start response:", asyncResult);
        const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
        if (predictionId) {
          localStorage.setItem('training_prediction_id', predictionId);
          // Set progress message before polling
          setProgressMessage('Training started, waiting for results...');
          setProgressPercent(10); // Show some initial progress
          pollResult = await pollForCompletion(predictionId, 'training');
          // NO state changes here yet, handled below based on pollResult
        } else {
          throw new Error('Server started training but did not return a prediction ID.');
        }
      } else {
        // Handle other errors (4xx, 5xx)
        const result = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(result.error || `Training request failed with status ${response.status}`);
      }
      // --- END MODIFIED RESPONSE HANDLING ---
      
      // --- Handle tagging AFTER successful polling (Simplified) --- 
      if (pollResult.status === 'completed') {
        // 1. Show immediate success in modal
        setProgressMessage('Training completed successfully!'); // Final message
        setProgressPercent(100);
        setIsOperationComplete(true); // Show Close button now
        setIsTagging(false); // Ensure tagging state is off for modal visuals
        
        // *** ADD PRE-FILTER LOGGING HERE (Polling Path) ***
        console.log("[handleTrainSelected - Polling Path] Preparing for background tagging...");
        // Get the full transaction objects for tagging
        const selectedTxObjectsForTagging = transactions.filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
        if (selectedTxObjectsForTagging.length > 0) {
            console.log(`[handleTrainSelected - Polling Path] Checking tags for ${selectedTxObjectsForTagging.length} selected transactions. Sample:`);
            selectedTxObjectsForTagging.slice(0, 3).forEach(tx => {
              console.log(` - ID: ${tx.lunchMoneyId}, Tags:`, tx?.tags);
            });
        }
        // *** END PRE-FILTER LOGGING ***

        // 2. Perform tagging in background
        tagTransactionsAsTrained(selectedTxObjectsForTagging).then(tagResult => {
          // fetchLastTrainedTimestamp(); // REMOVE direct call
          queryClient.invalidateQueries({ queryKey: ['lastTrainedTimestamp'] }); // Invalidate instead
          setToastMessage({ 
            message: `Tagging complete: ${tagResult?.successCount || 0} updated${(tagResult?.successCount || 0) > 0 ? `, ${tagResult?.successCount} trained` : ''}.`,
            type: (tagResult?.successCount || 0) > 0 ? 'success' : 'info' 
          });
          setSelectedTransactions([]); // Clear selection after toast
        }).catch(taggingError => {
            console.error("[Tagging] Error after training completion (polling):", taggingError);
            setToastMessage({ message: 'Error occurred during background tagging.', type: 'error' });
            setSelectedTransactions([]); // Still clear selection
        });
      } else {
        // Handle polling failure/timeout
        setToastMessage({ message: pollResult?.message || 'Training polling failed or timed out.', type: 'error' });
        setIsOperationComplete(true); // Allow closing modal even on failure
      }
      // --- End simplified tagging handling ---

    } catch (error) {
      console.error('Error starting training:', error);
      setError(error instanceof Error ? error.message : 'Failed to start training');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to start training', type: 'error' });
      setOperationInProgress(false);
      setOperationType('none');
    }
     }, [selectedTransactions, transactions, pollForCompletion, tagTransactionsAsTrained]);

  // Keep handleCategorizeSelected (Action handler)
  const handleCategorizeSelected = useCallback(async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({ message: 'Please select transactions to categorize', type: 'warning' });
      return;
    }

    // Filter out transactions that already have pending updates
    const transactionsToCategorize = selectedTransactions.filter(
      txId => !pendingCategoryUpdates[txId]
    );

    if (transactionsToCategorize.length === 0) {
      setToastMessage({ 
        message: 'All selected transactions already have pending category suggestions.', 
        type: 'info' 
      });
      return;
    }

    setOperationInProgress(true);
    setOperationType('categorizing');
    setProgressMessage('Starting categorization...');
    setProgressPercent(0);
    setError(null); // Clear previous errors
    // Clear existing pending updates for newly selected items
    setPendingCategoryUpdates(prev => {
      const newPending = { ...prev };
      transactionsToCategorize.forEach(txId => {
        delete newPending[txId]; // Remove any old pending state if re-categorizing
      });
      return newPending;
    });

    try {
      console.log("Sending transactions for categorization:", transactionsToCategorize);

      // Find the full transaction objects for the selected IDs
      const selectedTxObjects = transactions.filter(tx => 
        transactionsToCategorize.includes(tx.lunchMoneyId)
      ).map(tx => ({
        description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : tx.description,
        // Send money_in status based on the transaction data
        money_in: tx.is_income,
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)),
      }));

      console.log("Payload being sent:", selectedTxObjects);

      setProgressMessage('Sending request to server...');
      const response = await fetch('/api/classify/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: selectedTxObjects }),
      });

      // === START 403 HANDLING ===
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
        console.error('Categorization failed due to inactive subscription:', errorData);
        setToastMessage({ message: errorData.error || 'Categorization failed: Subscription inactive or trial expired.', type: 'error' });
        setError(errorData.error || 'Subscription inactive or trial expired.');
        setOperationInProgress(false);
        setOperationType('none');
        setProgressPercent(0); // Reset progress
        setProgressMessage('');
        return; // Stop further processing
      }
      // === END 403 HANDLING ===

      // --- MODIFIED RESPONSE HANDLING --- 
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous classification results:", syncResult);

        if (syncResult.status === 'completed' && Array.isArray(syncResult.results)) {
          setProgressMessage('Processing results...');
          setProgressPercent(100);
          updateTransactionsWithPredictions(syncResult.results);
          setToastMessage({ message: 'Categorization completed successfully!', type: 'success' });
          setOperationInProgress(false); // Close modal immediately
          setSelectedTransactions([]); // Clear selection after successful sync categorization
        } else {
          // Handle unexpected 200 response format
          throw new Error('Received unexpected success response format from server.');
        }
      } else if (response.status === 202) {
        // Asynchronous Processing Started
        const asyncResult = await response.json();
        console.log("Received asynchronous start response:", asyncResult);
        if (asyncResult.prediction_id) {
          setProgressMessage('Classification started. Waiting for results...');
          setProgressPercent(10); // Initial progress
          await pollForCompletion(asyncResult.prediction_id, 'categorizing');
          // Polling function handles setting final state (progress, message, modal close)
        } else {
          throw new Error('Server started processing but did not return a prediction ID.');
        }
      } else {
        // Handle other errors (4xx, 5xx)
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error during categorization:', errorData);
        setError(errorData.error || `Request failed with status ${response.status}`);
        setToastMessage({ message: errorData.error || `Categorization failed (Status: ${response.status})`, type: 'error' });
        setOperationInProgress(false);
      }
      // --- END MODIFIED RESPONSE HANDLING ---

    } catch (error) {
      console.error('Failed to categorize transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      setToastMessage({ message: `Categorization failed: ${errorMessage}`, type: 'error' });
      setOperationInProgress(false);
      setOperationType('none');
      setProgressPercent(0);
      setProgressMessage('');
    }
      }, [selectedTransactions, pendingCategoryUpdates, transactions, pollForCompletion, updateTransactionsWithPredictions]);

  // Keep handleCancelCategorization
  const handleCancelCategorization = useCallback(() => {
    console.log("Cancelling pending categorization updates.");
    setPendingCategoryUpdates({});
    // Comment out removed state setter
    // setCategorizedTransactions(new Map()); 
    setToastMessage({ message: 'Discarded pending category predictions.', type: 'success' }); 
  }, []); // No dependencies needed

  // Keep applyAllPredictedCategories
  const applyAllPredictedCategories = useCallback(async () => {
    const transactionIds = Object.keys(pendingCategoryUpdates);
    if (transactionIds.length === 0) {
      setToastMessage({
        message: "No categorizations to apply",
        type: "error"
      });
      return;
    }

    setApplyingAll(true);

    try {
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = []; // Store successful IDs
      
      for (let i = 0; i < transactionIds.length; i += batchSize) {
        const batch = transactionIds.slice(i, i + batchSize);
        
        const promises = batch.map(async (txId) => {
          const update = pendingCategoryUpdates[txId];
          
          try {
            const response = await fetch('/api/lunch-money/transactions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: txId,
                categoryId: update.categoryId === "none" ? null : update.categoryId,
                status: 'cleared'
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to update category');
            }
            
            return { success: true, txId };
          } catch (error) {
            console.error(`Error updating transaction ${txId}:`, error);
            return { success: false, txId };
          }
        });
        
        const results = await Promise.all(promises);
        
        results.forEach(result => {
          if (result.success) {
            successCount++;
            successfulTxIds.push(result.txId); // Add successful ID to the list
            
            setSuccessfulUpdates(prev => ({
              ...prev,
              [result.txId]: true
            }));
          } else {
            failCount++;
          }
        });
      }
      
      // INSTEAD: Invalidate queries
      if (successCount > 0) {
          console.log("[Apply All] Invalidating transaction and count queries.");
          queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });
          queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts', dateRange] });
      }

      setPendingCategoryUpdates({});
      
      setToastMessage({
        message: `Updated ${successCount} categories${failCount > 0 ? `, ${failCount} failed` : ''}`,
        type: successCount > 0 ? 'success' : 'error'
      });
      
    } catch (error) {
      console.error('Error applying all categories:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to apply categories',
        type: 'error'
      });
    } finally {
      setApplyingAll(false);
    }
  }, [pendingCategoryUpdates, categories, queryClient, dateRange, statusFilter]); // Ensure no fetchLastTrainedTimestamp here

  // Keep getCategoryNameById
  const getCategoryNameById = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    // Find category, ensuring it's an object before accessing .id
    const category = categories.find(cat => 
      typeof cat === 'object' && cat !== null && cat.id === categoryId
    );
    // Return name if found and is an object, otherwise return the original ID
    return (typeof category === 'object' && category !== null) ? category.name : categoryId;
  }, [categories]); // Dependency: categories

  // Keep applyPredictedCategory
  const applyPredictedCategory = useCallback(async (transactionId: string) => {
    const update = pendingCategoryUpdates[transactionId];
    if (!update) {
      console.error(`No pending update found for transaction ${transactionId}`);
      return;
    }
    setApplyingIndividual(transactionId);

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          categoryId: update.categoryId === "none" ? null : update.categoryId,
          status: 'cleared'
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      let categoryName = update.categoryId;
      // Use the memoized version of getCategoryNameById here
      const foundCategoryName = getCategoryNameById(update.categoryId);
      if (foundCategoryName !== update.categoryId) { // Check if a name was actually found
        categoryName = foundCategoryName;
      }
      
      // INSTEAD: Invalidate queries
      console.log(`[Apply Single ${transactionId}] Invalidating transaction and count queries.`);
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts', dateRange] });
      
      setSuccessfulUpdates(prev => ({
        ...prev,
        [transactionId]: true
      }));
      
      setPendingCategoryUpdates(prev => {
        const newUpdates = {...prev};
        delete newUpdates[transactionId];
        return newUpdates;
      });
      
      setToastMessage({
        message: 'Category updated in Lunch Money',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to update category');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to update category', type: 'error' });
    } finally {
      setApplyingIndividual(null);
    }
    // Ensure getCategoryNameById is included in dependencies
  }, [pendingCategoryUpdates, getCategoryNameById, queryClient, dateRange, statusFilter]); 

  // Update closeModal to use stopBackgroundTraining from hook
  const closeModal = useCallback(() => {
    setOperationInProgress(false);
    setOperationType('none');
    setProgressPercent(0);
    setProgressMessage('');
    setIsOperationComplete(false); 
    setIsTagging(false); 
    // Call stopBackgroundTraining from hook
    stopBackgroundTraining(); 
  }, [stopBackgroundTraining]); // Add hook function to dependency

  // Refactor handleTrainAllReviewed to use hook function
  const handleTrainAllReviewed = useCallback(async () => {
    const currentReviewedCount = countsData?.reviewedCount ?? 0;
    console.log(`[Train All - Start] Current reviewed count from query: ${currentReviewedCount}`);
    if (currentReviewedCount < 10) {
      setToastMessage({ message: `Need at least 10 reviewed transactions. Found ${currentReviewedCount}.`, type: 'error' });
      return;
    }
    // Call the hook function to start polling
    startBackgroundTraining(currentReviewedCount);
    setError(null);
    // Make the API call (fire and forget for polling)
    try {
      const payload = { trainAllReviewed: true };
      const trainResponse = await fetch('/api/classify/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (trainResponse.status === 403) {
        const errorData = await trainResponse.json().catch(() => ({ error: 'Subscription check failed' }));
        throw new Error(errorData.error || 'Subscription inactive or trial expired.');
      }
      if (!trainResponse.ok && trainResponse.status !== 202) { 
         const errorData = await trainResponse.json().catch(() => ({ error: `Server error ${trainResponse.status}` }));
         throw new Error(errorData.error || `Training initiation failed with status ${trainResponse.status}`);
      }
      console.log(`[Train All - Start] Successfully initiated training request (Status: ${trainResponse.status}).`);
    } catch (error) {
      console.error('[Train All - Start] Error initiating training:', error);
      const message = error instanceof Error ? error.message : 'Failed to start training';
      setError(message);
      toast.error(`Failed to start training: ${message}`, { id: 'training-toast' }); // Use constant ID if available
      stopBackgroundTraining(); // Stop polling on initiation error
    }
  }, [countsData, startBackgroundTraining, stopBackgroundTraining]); // Depend on hook data/functions

  // Keep handleNoteChange
  const handleNoteChange = useCallback(async (transactionId: string, newNote: string) => {
    console.log(`Attempting to save note for tx ${transactionId}: "${newNote}"`);
    setUpdatingNoteId(transactionId); // Set loading state
    setToastMessage(null); // Clear previous toasts

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          notes: newNote,
          // IMPORTANT: Do NOT include status or categoryId here!
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Throw an error to be caught below
        throw new Error(responseData.error || 'Failed to update note');
      }

      // INSTEAD: Invalidate query
      console.log(`[Note Update ${transactionId}] Invalidating transaction query.`);
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });

      // Show success toast
      setToastMessage({ message: 'Note updated successfully.', type: 'success' });

    } catch (error) {
      console.error(`Error saving note for tx ${transactionId}:`, error);
      const message = error instanceof Error ? error.message : 'Failed to save note';
      setError(message); // Set general error state if needed
      setToastMessage({ message, type: 'error' });
      // Re-throw the error if you want the NoteInput component to catch it too
      throw error;
    } finally {
      setUpdatingNoteId(null); // Clear loading state
    }
  }, [setToastMessage, setError, queryClient, dateRange, statusFilter]); // Add dependencies

  // Keep handleTransferOriginalNames
  const handleTransferOriginalNames = useCallback(async () => {
    // 1. Filter selected transactions for those needing the update
    const transactionsToUpdate = transactions.filter(tx => 
      selectedTransactions.includes(tx.lunchMoneyId) &&
      tx.originalData?.payee === '[No Payee]' &&
      tx.originalData?.original_name && 
      tx.originalData.original_name.trim() !== ''
    );

    if (transactionsToUpdate.length === 0) {
      setToastMessage({ message: "No selected transactions found with payee '[No Payee]' and a valid Original Name.", type: "warning" });
      return;
    }

    console.log(`[Admin] Found ${transactionsToUpdate.length} transactions to update payee for.`);
    setIsTransferringPayees(true);
    setOperationInProgress(true); // Use general operation lock

    try {
      const batchSize = 10; // Process in batches
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = [];
      const updatedPayeesMap: Record<string, string> = {}; // Store updated payees for local update

      for (let i = 0; i < transactionsToUpdate.length; i += batchSize) {
        const batch = transactionsToUpdate.slice(i, i + batchSize);
        console.log(`[Admin] Processing batch ${i / batchSize + 1} with ${batch.length} transactions.`);

        const promises = batch.map(async (tx) => {
          const transactionId = tx.lunchMoneyId;
          const newPayee = tx.originalData.original_name; // Already checked it exists

          try {
            const response = await fetch('/api/lunch-money/transactions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: transactionId,
                payee: newPayee, // Send the new payee
                // We don't need to send status or category here
              })
            });

            const responseData = await response.json();

            if (!response.ok || responseData.error) {
              const errorMsg = responseData.error || `API Error ${response.status}`;
              console.error(`[Admin] Failed to update payee for ${transactionId}:`, errorMsg);
              throw new Error(errorMsg);
            }

            console.log(`[Admin] Successfully updated payee for ${transactionId} to "${newPayee}"`);
            return { success: true, txId: transactionId, updatedPayee: newPayee };
          } catch (error) {
            console.error(`[Admin] Network/fetch error updating payee for ${transactionId}:`, error);
            return { success: false, txId: transactionId, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });

        const results = await Promise.allSettled(promises);

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
            successfulTxIds.push(result.value.txId);
            updatedPayeesMap[result.value.txId] = result.value.updatedPayee;
          } else {
            failCount++;
            // Log detailed error if available
            if (result.status === 'fulfilled' && !result.value.success) {
              console.error(`[Admin] Update failed for TxID ${result.value.txId}: ${result.value.error}`);
            } else if (result.status === 'rejected') {
              console.error(`[Admin] Batch promise rejected:`, result.reason);
            }
          }
        });
      } // End batch loop

      // INSTEAD: Invalidate query
      if (successCount > 0) {
         console.log("[Admin Payee Transfer] Invalidating transaction query.");
         queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions', dateRange, statusFilter] });
      }

      // Show feedback toast
      if (failCount > 0) {
        setToastMessage({ message: `Payee Transfer: ${successCount} updated, ${failCount} failed. Check console for errors.`, type: "error" });
      } else {
        setToastMessage({ message: `Successfully transferred original name to payee for ${successCount} transactions.`, type: "success" });
      }

      // Optionally clear selection on success
      if (failCount === 0) {
         setSelectedTransactions(prev => prev.filter(id => !successfulTxIds.includes(id)));
      }

    } catch (error) {
      console.error('[Admin] Error during payee transfer process:', error);
      setToastMessage({ message: 'An unexpected error occurred during the payee transfer.', type: "error" });
    } finally {
      setIsTransferringPayees(false);
      setOperationInProgress(false); // Release general operation lock
    }
  }, [transactions, selectedTransactions, setToastMessage, setSelectedTransactions, queryClient, dateRange, statusFilter]); // Add dependencies

  return (
    <div className="text-gray-900 text-sm bg-white min-h-screen p-4">
      {/* Toast notification */}
      <ToastNotification toastMessage={toastMessage} />

      {/* Operation Progress Modal */}
      <ProgressModal
        operationInProgress={operationInProgress}
        operationType={operationType}
        progressPercent={progressPercent}
        progressMessage={progressMessage}
        isComplete={isOperationComplete}
        onClose={closeModal}
      />

      {/* Admin Mode Toggle */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        <span className="text-sm font-medium text-gray-700">Admin Mode</span>
        <Switch
          checked={isAdminMode}
          onChange={setIsAdminMode}
          className={`${
            isAdminMode ? 'bg-blue-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          <span
            className={`${
              isAdminMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {/* Controls Wrapper */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap md:flex-nowrap items-stretch gap-6">
        {/* Transaction Filters - Use hook values */} 
        <div className="flex-1 min-w-[350px]">
          <TransactionFilters
            pendingDateRange={pendingDateRange}
            handleDateRangeChange={handleDateRangeChange} 
            applyDateFilter={applyDateFilter}
            isApplying={isApplyingDates} 
            trainedCount={countsData?.trainedCount ?? 0}
            clearedCount={countsData?.reviewedCount ?? 0}    
            unclearedCount={countsData?.unreviewedCount ?? 0}  
            isLoadingCounts={isLoadingCounts}
            countsError={countsError}
            isTrainingInBackground={isTrainingInBackground} 
            operationInProgress={operationInProgress} // Keep passing local operation lock if needed
            lastTrainedTimestamp={lastTrainedTimestamp}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>

        {/* Categorization Controls - Use hook values */} 
        <div className="flex-1 min-w-[300px] flex flex-col gap-4"> 
          <CategorizationControls
            pendingCategoryUpdates={pendingCategoryUpdates}
            applyingAll={applyingAll}
            applyAllPredictedCategories={applyAllPredictedCategories}
            handleTrainSelected={handleTrainSelected}
            handleCategorizeSelected={handleCategorizeSelected}
            handleTrainAllReviewed={handleTrainAllReviewed}
            isTrainingInBackground={isTrainingInBackground} // Pass polling state from hook
            selectedTransactionsCount={selectedTransactions.length}
            loading={loading} // Pass combined loading state
            operationInProgress={operationInProgress} // Keep passing local operation lock
            handleCancelCategorization={handleCancelCategorization}
            lastTrainedTimestamp={lastTrainedTimestamp}
          />
          {/* Admin Mode Buttons */}
          {isAdminMode && (
            <div className="border-t border-gray-200 pt-4 mt-4 flex items-center gap-4">
              <button
                onClick={() => setFilterNoPayee(prev => !prev)} // Toggle filter state
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${filterNoPayee ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                disabled={operationInProgress} 
              >
                {filterNoPayee ? 'Clear "[No Payee]" Filter' : 'Filter by "[No Payee]"'}
              </button>
              <button
                onClick={() => handleTransferOriginalNames()} // Define this function next
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                disabled={operationInProgress || selectedTransactions.length === 0 || !transactions.some(tx => selectedTransactions.includes(tx.lunchMoneyId) && tx.originalData?.payee === '[No Payee]')}
              >
                Transfer Original Name to Payee (Selected)
              </button>
            </div>
          )}
        </div>
      </div>

     <TransactionTable
        filteredTransactions={displayedTransactions}
        selectedTransactions={selectedTransactions}
        handleSelectTransaction={handleSelectTransaction}
        handleSelectAll={handleSelectAll}
        pendingCategoryUpdates={pendingCategoryUpdates}
        categories={categories}
        handleCategoryChange={handleCategoryChange} // Ensure this line exists
        updatingCategory={updatingCategory}     // Ensure this line exists
        successfulUpdates={successfulUpdates}
        applyPredictedCategory={applyPredictedCategory}
        applyingIndividual={applyingIndividual}
        cancelSinglePrediction={cancelSinglePrediction}
        getCategoryNameById={getCategoryNameById}
        loading={loading}
        handleNoteChange={handleNoteChange}
        updatingNoteId={updatingNoteId}
        isAdminMode={isAdminMode}
      />
    </div>
  );
}