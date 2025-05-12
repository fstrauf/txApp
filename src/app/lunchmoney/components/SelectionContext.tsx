import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SelectionContextType {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  isSelected: (id: string) => boolean;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <SelectionContext.Provider value={{ selectedIds, toggleSelection, isSelected, clearSelection }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelectionContext = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelectionContext must be used within a SelectionProvider');
  return ctx;
}; 