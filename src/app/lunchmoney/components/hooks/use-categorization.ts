import { useState } from 'react';
import { Transaction } from '../types';

type PendingUpdate = {
  categoryId: string;
  score: number;
};

export interface CategorizationState {
  pendingUpdates: Record<string, PendingUpdate>;
  applying: {
    all: boolean;
    individual: string | null;
  };
  results: Map<string, {category: string, score: number}>;
  stats: {
    total: number;
    applied: number;
    failed: number;
  };
}

export function useCategorization() {
  // Consolidated categorization state
  const [categorizationState, setCategorizationState] = useState<CategorizationState>({
    pendingUpdates: {},
    applying: {
      all: false,
      individual: null
    },
    results: new Map(),
    stats: {
      total: 0,
      applied: 0,
      failed: 0
    }
  });

  // Update local transaction data with predicted categories
  const updateTransactionsWithPredictions = (
    results: any[], 
    transactions: Transaction[], 
    selectedTransactions: string[], 
    categories: any[],
    onSuccess: (message: string) => void
  ) => {
    if (!results || results.length === 0) {
      console.log("No results to update transactions with");
      return;
    }
    
    console.log(`Processing ${results.length} prediction results to update transactions`);
    
    // Special case for the API format
    const hasCorrectFormat = results.length > 0 && 
      results[0] && 
      (results[0].narrative !== undefined && results[0].predicted_category !== undefined);
    
    if (hasCorrectFormat) {
      console.log("Results appear to be in the correct format!");
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
    
    // Create a mapping of transaction IDs to predicted categories and scores for easier access
    const pendingUpdates: Record<string, PendingUpdate> = {};
    
    // Map the predictions to transaction IDs
    selectedTransactions.forEach(txId => {
      const tx = transactions.find(t => t.lunchMoneyId === txId);
      if (tx && tx.description) {
        const prediction = newCategorizedTransactions.get(tx.description);
        if (prediction) {
          // Find the category ID for this predicted category name
          const categoryObj = categories.find(cat => 
            typeof cat !== 'string' && 
            cat.name.toLowerCase() === prediction.category.toLowerCase()
          );
          
          // Use the found category ID or the category name as fallback
          const categoryId = categoryObj && typeof categoryObj !== 'string' 
            ? categoryObj.id 
            : prediction.category;
          
          pendingUpdates[txId] = {
            categoryId,
            score: prediction.score
          };
        }
      }
    });
    
    // Update categorization state
    setCategorizationState(prev => ({
      ...prev,
      pendingUpdates,
      results: newCategorizedTransactions,
      stats: {
        ...prev.stats,
        total: Object.keys(pendingUpdates).length
      }
    }));
    
    console.log("Prepared", Object.keys(pendingUpdates).length, "pending category updates");
    
    // Show a success toast
    onSuccess(`Categorized ${Object.keys(pendingUpdates).length} transactions. Review and apply the changes.`);
  };

  // Reset categorization state to initial values
  const resetCategorizationState = () => {
    setCategorizationState({
      pendingUpdates: {},
      applying: {
        all: false,
        individual: null
      },
      results: new Map(),
      stats: {
        total: 0,
        applied: 0,
        failed: 0
      }
    });
  };

  // Function to apply a single predicted category
  const applyPredictedCategory = async (
    transactionId: string,
    categories: any[],
    updateTransaction: (txId: string, categoryId: string, categoryName: string) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    const update = categorizationState.pendingUpdates[transactionId];
    if (!update) {
      console.error(`No pending update found for transaction ${transactionId}`);
      return;
    }

    // Set loading state for this specific transaction
    setCategorizationState(prev => ({
      ...prev,
      applying: {
        ...prev.applying,
        individual: transactionId
      }
    }));

    try {
      // Send update to the API
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          categoryId: update.categoryId === "none" ? null : update.categoryId
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      // Find category name for display
      let categoryName = update.categoryId;
      const selectedCategory = categories.find(cat => 
        typeof cat !== 'string' && cat.id === update.categoryId
      );
      if (selectedCategory && typeof selectedCategory !== 'string') {
        categoryName = selectedCategory.name;
      }
      
      // Call the update function passed from the parent
      updateTransaction(transactionId, update.categoryId, categoryName);
      
      // Clear this pending update and update stats
      setCategorizationState(prev => {
        const newPendingUpdates = {...prev.pendingUpdates};
        delete newPendingUpdates[transactionId];
        
        return {
          ...prev,
          pendingUpdates: newPendingUpdates,
          applying: {
            ...prev.applying,
            individual: null
          },
          stats: {
            ...prev.stats,
            applied: prev.stats.applied + 1
          }
        };
      });
      
      // Show success toast
      onSuccess('Category updated in Lunch Money');
      
    } catch (error) {
      console.error('Error updating category:', error);
      
      setCategorizationState(prev => ({
        ...prev,
        applying: {
          ...prev.applying,
          individual: null
        },
        stats: {
          ...prev.stats,
          failed: prev.stats.failed + 1
        }
      }));
      
      onError(error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  // Function to apply all predicted categories
  const applyAllPredictedCategories = async (
    categories: any[],
    updateTransaction: (txId: string, categoryId: string, categoryName: string) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    const pendingUpdates = categorizationState.pendingUpdates;
    const transactionIds = Object.keys(pendingUpdates);
    
    if (transactionIds.length === 0) {
      onError("No categorizations to apply");
      return;
    }

    // Set global loading state
    setCategorizationState(prev => ({
      ...prev,
      applying: {
        ...prev.applying,
        all: true
      }
    }));

    try {
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < transactionIds.length; i += batchSize) {
        const batch = transactionIds.slice(i, i + batchSize);
        
        // Create an array of promises for the batch
        const promises = batch.map(async (txId) => {
          const update = pendingUpdates[txId];
          
          try {
            const response = await fetch('/api/lunch-money/transactions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: txId,
                categoryId: update.categoryId === "none" ? null : update.categoryId
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to update category');
            }
            
            return { success: true, txId, update };
          } catch (error) {
            console.error(`Error updating transaction ${txId}:`, error);
            return { success: false, txId, update };
          }
        });
        
        // Wait for all promises in this batch to complete
        const results = await Promise.all(promises);
        
        // Count successes and failures
        results.forEach(result => {
          if (result.success) {
            successCount++;
            
            // Get the update info
            const update = result.update;
            
            // Find category name for display
            let categoryName = update.categoryId;
            const selectedCategory = categories.find(cat => 
              typeof cat !== 'string' && cat.id === update.categoryId
            );
            if (selectedCategory && typeof selectedCategory !== 'string') {
              categoryName = selectedCategory.name;
            }
            
            // Call the update function passed from the parent
            updateTransaction(result.txId, update.categoryId, categoryName);
          } else {
            failCount++;
          }
        });
      }
      
      // Update categorization state with results
      setCategorizationState(prev => ({
        ...prev,
        pendingUpdates: {},
        applying: {
          all: false,
          individual: null
        },
        stats: {
          ...prev.stats,
          applied: prev.stats.applied + successCount,
          failed: prev.stats.failed + failCount
        }
      }));
      
      // Show success toast
      onSuccess(`Updated ${successCount} categories${failCount > 0 ? `, ${failCount} failed` : ''}`);
      
    } catch (error) {
      console.error('Error applying all categories:', error);
      
      setCategorizationState(prev => ({
        ...prev,
        applying: {
          ...prev.applying,
          all: false
        }
      }));
      
      onError(error instanceof Error ? error.message : 'Failed to apply categories');
    }
  };

  return {
    categorizationState,
    setCategorizationState,
    resetCategorizationState,
    updateTransactionsWithPredictions,
    applyPredictedCategory,
    applyAllPredictedCategories
  };
} 