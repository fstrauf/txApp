'use client';

import { useMemo, useCallback, useState } from 'react';
import { format } from 'date-fns';
import { 
  Transaction, 
  Category, 
  // DateRange, // Type might still be used, but state managed in hook
  ToastMessage, 
  OperationType 
} from './types';

// Import UI components
import ProgressModal from './progress-modal';
import TransactionFilters from './transaction-filters';
import CategorizationControls from './categorization-controls';
import TransactionTable from './transaction-table';
import ToastNotification from './toast-notification';
import { Switch } from '@headlessui/react';

// Import Hooks
import { useToast } from './hooks';
import { useTransactionData } from './hooks'; // Import the main data hook
import { useCategorization } from './hooks'; // Added useCategorization
import { useTraining } from './hooks'; // Added useTraining
import { useManualTransactionActions } from './hooks'; // Added useManualTransactionActions
import { useAdminOperations } from './hooks'; // Added useAdminOperations
import { SelectionProvider } from './SelectionContext'; // <-- ADD THIS
// Import other hooks as needed later (useTraining, useCategorization, etc.)

const EXPENSE_SORTED_TRAINED_TAG = 'expense-sorted-trained';

export default function TransactionList() {

  // === Hook Instantiation ===
  const { 
    toastMessage: currentToastMessage, 
    showSuccess, 
    showError, 
    showInfo // Added showInfo for general messages
  } = useToast();

  const { 
    transactions: hookTransactions,
    categories: hookCategories,
    counts: hookCounts,
    isLoading,
    dateFilter, 
    setDateFilter, 
    statusFilter, 
    setStatusFilter,
    updateTransaction, 
    updateTransactions, 
    getCategoryNameById,
  } = useTransactionData();

  const {
    categorizationState,
    resetCategorizationState,
    updateTransactionsWithPredictions: hookUpdateTransactionsWithPredictions,
    applyPredictedCategory: hookApplyPredictedCategory,
    applyAllPredictedCategories: hookApplyAllPredictedCategories,
    cancelSinglePrediction: hookCancelSinglePrediction,
  } = useCategorization();

  const {
    handleManualCategoryChange,
    handleNoteChange,
  } = useManualTransactionActions();

  const {
    isAdminMode,
    setIsAdminMode,
    filterNoPayee,
    setFilterNoPayee,
    handleTransferOriginalNames,
    isTransferringNames,
  } = useAdminOperations({ allTransactions: hookTransactions, selectedIds: [] });

  // === Calculations ===
  // Calculate transaction stats using hookTransactions
  const transactionStats = useMemo(() => {
    let uncategorizedCount = 0;
    hookTransactions.forEach(tx => {
      const isUncategorized = !tx.originalData?.category_id;
      if (isUncategorized) uncategorizedCount++;
    });
    return { uncategorizedCount };
  }, [hookTransactions]);

  // Admin filter logic using hookTransactions
  const displayedTransactions = useMemo(() => {
    if (isAdminMode && filterNoPayee) {
      return hookTransactions.filter(tx => tx.originalData?.payee === '[No Payee]'); 
    }
    return hookTransactions; 
  }, [hookTransactions, isAdminMode, filterNoPayee]);

  // === Placeholder Handlers (To be moved to useTraining, useManualTransactionActions, useAdminOperations) ===
  // This is called by useTraining after AI categorization completes
  // const updateTransactionsWithPredictions = useCallback((results: any[]) => { /* ... */ }, [selectedIds, hookCategories, showSuccess, setPendingCategoryUpdates]);
  // Hook version will be passed to useTraining
  const handleAIUpdateWithPredictionsForTraining = useCallback((results: any[], processedTransactionIds: string[]) => {
    // Pass: API results, the IDs for these results, all transactions, all categories, and the success callback.
    // `selectedIds` from the outer scope is not directly needed here anymore, as `processedTransactionIds` is more specific.
    hookUpdateTransactionsWithPredictions(results, processedTransactionIds, hookTransactions, hookCategories, showSuccess);
  }, [hookUpdateTransactionsWithPredictions, hookTransactions, hookCategories, showSuccess]);

  const {
    operationState: trainingOperationState,
    lastTrainedTimestamp: trainingLastTrainedTimestamp,
    resetOperationState: resetTrainingOperationState,
    trainSelected: trainingHookTrainSelected,
    trainAllReviewed: trainingHookTrainAllReviewed,
    categorizeSelected: trainingHookCategorizeSelected,
  } = useTraining({
    transactions: hookTransactions,
    categories: hookCategories,
    selectedIds: [], // Will update this in the next step
    showToast: showSuccess,
    updateTransactions,
    onCategorizationComplete: handleAIUpdateWithPredictionsForTraining,
  });

  // === Action Handlers ===
  // Training actions
  const handleTrainSelected = useCallback(() => {
    trainingHookTrainSelected();
  }, [trainingHookTrainSelected]);

  const handleCategorizeSelected = useCallback(() => {
    trainingHookCategorizeSelected();
  }, [trainingHookCategorizeSelected]);

  const handleTrainAllReviewed = useCallback(() => {
    trainingHookTrainAllReviewed();
  }, [trainingHookTrainAllReviewed]);
  
  // Categorization actions (from useCategorization)
  const applyPredictedCategory = useCallback(async (transactionId: string) => {
    hookApplyPredictedCategory(
              transactionId,
      hookCategories, 
      (txId, catId, catName) => {
        const targetTransaction = hookTransactions.find(t => t.lunchMoneyId === txId);
        if (targetTransaction) {
            const updatedTx = {
                ...targetTransaction,
                lunchMoneyCategory: catName,
                originalData: { ...(targetTransaction.originalData || {}), category_id: catId }
            };
            updateTransaction(updatedTx);
        }
      },
      showSuccess,
      showError
    );
  }, [hookApplyPredictedCategory, hookCategories, updateTransaction, showSuccess, showError, hookTransactions]);

  const applyAllPredictedCategories = useCallback(async () => {
    hookApplyAllPredictedCategories(
      hookCategories,
      (txId, catId, catName) => {
        const targetTransaction = hookTransactions.find(t => t.lunchMoneyId === txId);
        if (targetTransaction) {
            const updatedTx = {
                ...targetTransaction,
                lunchMoneyCategory: catName,
                originalData: { ...(targetTransaction.originalData || {}), category_id: catId }
            };
            updateTransaction(updatedTx);
        }
      },
      showSuccess, 
      showError
    );
  }, [hookApplyAllPredictedCategories, hookCategories, updateTransaction, showSuccess, showError, hookTransactions]);

  const cancelSinglePrediction = useCallback((transactionId: string) => {
    hookCancelSinglePrediction(transactionId, showInfo);
  }, [hookCancelSinglePrediction, showInfo]);

  const handleCancelAllCategorizations = useCallback(() => {
    resetCategorizationState();
    showSuccess('Discarded all pending predictions.');
  }, [resetCategorizationState, showSuccess]);

  // Define the handler that TransactionFilters will call when Apply is clicked
  const handleApplyDateFilter = useCallback((newStartDate: string, newEndDate: string) => {
    console.log(`[TransactionList] Applying date filter: ${newStartDate} to ${newEndDate}`);
    // This updates the state used in the query key, triggering the refetch
    setDateFilter(prev => ({ 
              ...prev,
        startDate: newStartDate,
        endDate: newEndDate,
        isCustomRange: true, // Applying dates makes it a custom range
        isCurrentMonth: false, 
        isPreviousMonth: false
    }));
  }, [setDateFilter]);

  // === Render logic using hook state... ===

  const overallIsLoading = isLoading || trainingOperationState.inProgress || categorizationState.applying.all || !!categorizationState.applying.individual || isTransferringNames;

  // Add this log before the return statement
  console.log('[TransactionList Render] Pending Updates Count:', Object.keys(categorizationState.pendingUpdates).length, 'State Object:', categorizationState.pendingUpdates);

  return (
    <SelectionProvider>
      <div className="text-gray-900 text-sm bg-white min-h-screen p-4">
        <ToastNotification toastMessage={currentToastMessage} />
        <ProgressModal
          operationInProgress={trainingOperationState.inProgress || isTransferringNames}
          operationType={isTransferringNames ? 'admin' as OperationType : trainingOperationState.type}
          progressPercent={trainingOperationState.progress.percent}
          progressMessage={isTransferringNames ? 'Transferring original names...' : trainingOperationState.progress.message}
          isComplete={(trainingOperationState.result.success && !trainingOperationState.inProgress && trainingOperationState.type !== 'none') || (!isTransferringNames && trainingOperationState.type === 'none' && trainingOperationState.result.success)}
          onClose={resetTrainingOperationState}
        />
        <div className="my-4 flex items-center space-x-4 mb-2">
            <Switch.Group>
                <div className="flex items-center">
          <Switch
            checked={isAdminMode}
            onChange={setIsAdminMode}
                        className={`${isAdminMode ? 'bg-blue-600' : 'bg-gray-200'}
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
                            className={`${isAdminMode ? 'translate-x-6' : 'translate-x-1'}
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
                    <Switch.Label className="ml-2 text-sm text-gray-700">Admin Mode</Switch.Label>
                </div>
            </Switch.Group>

            {/* Button to transfer original names, visible only in Admin Mode */}
            {isAdminMode && (
              <button
                onClick={() => {
                  console.log('[TransactionList] Admin "Transfer Names" BUTTON CLICKED! Now calling handleTransferOriginalNames...');
                  // First, verify this log appears in the console when the button is clicked.
                  // If it does, then uncomment the line below to call the actual function.
                  handleTransferOriginalNames(); 
                }}
                disabled={isTransferringNames || selectedIds.length === 0}
                className="ml-4 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isTransferringNames ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Transferring...
                  </span>
                ) : (
                  'Transfer Original Names to Description'
                )}
              </button>
            )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-row items-stretch gap-6">
          <div className="flex-1">
            <TransactionFilters
              // Pass the actual filter dates as initial values
              initialStartDate={dateFilter.startDate} 
              initialEndDate={dateFilter.endDate}
              // Pass the callback for the Apply button
              onApplyDates={handleApplyDateFilter} 
              // Pass loading state for disabling inputs/button during fetch
              isApplying={isLoading} 
              trainedCount={hookCounts.trained} 
              clearedCount={hookCounts.cleared} 
              unclearedCount={hookCounts.uncleared} 
              operationInProgress={trainingOperationState.inProgress || isTransferringNames}
              lastTrainedTimestamp={trainingLastTrainedTimestamp}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <CategorizationControls
              pendingCategoryUpdates={categorizationState.pendingUpdates} 
              applyingAll={categorizationState.applying.all}
              applyAllPredictedCategories={applyAllPredictedCategories}
              handleTrainSelected={handleTrainSelected}
              handleCategorizeSelected={handleCategorizeSelected}
              handleTrainAllReviewed={handleTrainAllReviewed}
              selectedTransactionsCount={0}
              loading={overallIsLoading}
              operationInProgress={trainingOperationState.inProgress || isTransferringNames} 
              handleCancelCategorization={handleCancelAllCategorizations} 
              lastTrainedTimestamp={trainingLastTrainedTimestamp} 
            />
          </div>
        </div>

        <TransactionTable
          filteredTransactions={displayedTransactions}
          pendingCategoryUpdates={categorizationState.pendingUpdates}
          categories={hookCategories}
          handleCategoryChange={handleManualCategoryChange}
          applyPredictedCategory={applyPredictedCategory}
          applyingIndividual={categorizationState.applying.individual}
          cancelSinglePrediction={cancelSinglePrediction}
          getCategoryNameById={getCategoryNameById}
          loading={isLoading || trainingOperationState.inProgress || isTransferringNames}
          handleNoteChange={handleNoteChange}
          isAdminMode={isAdminMode}
          updatingCategory={categorizationState.applying.individual}
          successfulUpdates={{}}
          updatingNoteId={null}
        />
      </div>
    </SelectionProvider>
  );
}