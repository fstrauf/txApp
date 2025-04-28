import { useState } from 'react';
import { Transaction } from '../types';

interface SelectionState {
  selectedIds: string[];
  lastSelected: string | null;
}

// Type definition to ensure id exists and is a string
type WithStringId = { id: string };

export function useSelection() {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedIds: [],
    lastSelected: null
  });

  // Clear selection
  const clearSelection = () => {
    setSelectionState({
      selectedIds: [],
      lastSelected: null
    });
  };

  // Toggle selection of a single item
  const toggleSelection = (id: string) => {
    if (!id) return;
    
    setSelectionState(prev => {
      const isSelected = prev.selectedIds.includes(id);
      return {
        selectedIds: isSelected
          ? prev.selectedIds.filter(selectedId => selectedId !== id)
          : [...prev.selectedIds, id],
        lastSelected: id
      };
    });
  };

  // Get a range of IDs between two items
  const getIdRange = (allItems: WithStringId[], fromId: string, toId: string): string[] => {
    const allIds = allItems.map(item => item.id);
    const fromIndex = allIds.indexOf(fromId);
    const toIndex = allIds.indexOf(toId);
    
    if (fromIndex < 0 || toIndex < 0) return [];
    
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    
    return allIds.slice(start, end + 1);
  };

  // Toggle selection with shift key support for ranges
  const toggleSelectionWithRange = (
    id: string,
    allItems: WithStringId[],
    shiftKey: boolean = false
  ) => {
    if (!id) return;

    setSelectionState(prev => {
      // If shift key is pressed and we have a last selected item, select the range
      if (shiftKey && prev.lastSelected && id !== prev.lastSelected) {
        const rangeIds = getIdRange(allItems, prev.lastSelected, id);
        
        if (rangeIds.length > 0) {
          // Combine existing selection with range
          const newSelection = [...new Set([...prev.selectedIds, ...rangeIds])];
          
          return {
            selectedIds: newSelection,
            lastSelected: id
          };
        }
      }
      
      // Normal toggle behavior if shift key is not pressed
      const isSelected = prev.selectedIds.includes(id);
      return {
        selectedIds: isSelected
          ? prev.selectedIds.filter(selectedId => selectedId !== id)
          : [...prev.selectedIds, id],
        lastSelected: id
      };
    });
  };

  // Get valid IDs from a list of items
  const getValidIds = (itemsList: WithStringId[]): string[] => {
    return itemsList.map(item => item.id).filter(Boolean);
  };

  // Select all items from a list
  const selectAll = (itemsList: WithStringId[]) => {
    const allIds = getValidIds(itemsList);
    
    setSelectionState(prev => {
      // If all items are already selected, deselect all
      const allSelected = allIds.every(id => prev.selectedIds.includes(id));
      
      return {
        selectedIds: allSelected ? [] : allIds,
        lastSelected: allSelected ? null : prev.lastSelected
      };
    });
  };

  // Select all items matching a filter condition
  const selectFiltered = <T>(
    allItems: T[],
    filterFn: (item: T) => boolean,
    idSelector: (item: T) => string,
    toggle: boolean = true
  ) => {
    const filteredIds = allItems
      .filter(filterFn)
      .map(idSelector)
      .filter(Boolean);
    
    if (filteredIds.length === 0) return;
    
    setSelectionState(prev => {
      // If toggle is true and all filtered items are already selected, deselect them
      const allFilteredSelected = filteredIds.every(id => prev.selectedIds.includes(id));
      
      if (toggle && allFilteredSelected && prev.selectedIds.length > 0) {
        return {
          selectedIds: prev.selectedIds.filter(id => !filteredIds.includes(id)),
          lastSelected: prev.lastSelected
        };
      } else {
        // Add all filtered items to selection
        return {
          selectedIds: [...new Set([...prev.selectedIds, ...filteredIds])],
          lastSelected: prev.lastSelected
        };
      }
    });
  };

  // Check if an item is selected
  const isSelected = (id: string): boolean => {
    return Boolean(id && selectionState.selectedIds.includes(id));
  };

  // Check if all items are selected
  const areAllSelected = (itemsList: WithStringId[]): boolean => {
    const allIds = getValidIds(itemsList);
    return allIds.length > 0 && allIds.every(id => selectionState.selectedIds.includes(id));
  };

  // Filter items based on selection
  const getSelectedItems = <T>(items: T[], idSelector: (item: T) => string): T[] => {
    return items.filter(item => selectionState.selectedIds.includes(idSelector(item)));
  };
  
  // Helper for working with transactions
  const createTransactionSelector = (tx: Transaction) => tx.lunchMoneyId || '';
  
  // Add custom helpers specifically for transactions
  const transactionHelpers = {
    // Get selected transactions
    getSelectedTransactions: (transactions: Transaction[]): Transaction[] => {
      return transactions.filter(tx => 
        tx.lunchMoneyId && selectionState.selectedIds.includes(tx.lunchMoneyId)
      );
    },
    
    // Select transactions with a specific category
    selectByCategory: (transactions: Transaction[], categoryId: string) => {
      selectFiltered(
        transactions,
        (tx: Transaction) => {
          if (categoryId === 'none') {
            return !tx.lunchMoneyCategory;
          }
          
          return tx.originalData?.category_id === categoryId;
        },
        createTransactionSelector,
        true
      );
    },
    
    // Select transactions with a specific tag
    selectByTag: (transactions: Transaction[], tagName: string) => {
      selectFiltered(
        transactions,
        (tx: Transaction) => {
          if (!tx.tags || !Array.isArray(tx.tags)) return false;
          
          return tx.tags.some((tag: any) => 
            (typeof tag === 'string' && tag.toLowerCase() === tagName.toLowerCase()) ||
            (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === tagName.toLowerCase())
          );
        },
        createTransactionSelector,
        true
      );
    }
  };

  return {
    selectedIds: selectionState.selectedIds,
    clearSelection,
    toggleSelection,
    toggleSelectionWithRange,
    selectAll,
    selectFiltered,
    isSelected,
    areAllSelected,
    getSelectedItems,
    ...transactionHelpers
  };
} 