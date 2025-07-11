'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import {  
  XMarkIcon, 
  CloudArrowUpIcon,
  CheckIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { CSVMappingGuide } from './CSVMappingGuide';

// Import modular components
import UploadCSVTab from './data-management/UploadCSVTab';
import ValidateTransactionsTab, { ValidationTransaction } from './data-management/ValidateTransactionsTab';
import SettingsTab from './data-management/SettingsTab';
import DuplicateReport from './data-management/DuplicateReport';
import SecurityBanner from './data-management/SecurityBanner';

import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { useTransactionValidation } from '../hooks/useTransactionValidation';
import { useCsvProcessing } from '../hooks/useCsvProcessing';


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

type TabType = 'upload' | 'validate' | 'settings';



const DataManagementDrawer: React.FC<DataManagementDrawerProps> = ({
  spreadsheetLinked,
  onClose,
  defaultTab = 'upload',
}) => {
  const { userData, updateBaseCurrency } = usePersonalFinanceStore();
  
  const [showDuplicateReport, setShowDuplicateReport] = useState(false);
  
  const baseCurrency = userData.baseCurrency || 'USD';

  const {
    validationTransactions,
    setValidationTransactions,
    handleCompleteValidation,
    ...validationProps
  } = useTransactionValidation();

  const initialTabId = defaultTab === 'validate' && validationTransactions.length === 0 ? 'upload' : defaultTab;
  const [activeTab, setActiveTab] = useState<TabType>(initialTabId);

  const handleValidationReady = (transactions: ValidationTransaction[]) => {
    setValidationTransactions(transactions);
    setActiveTab('validate');
  };

  const {
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
  } = useCsvProcessing({
    onValidationReady: handleValidationReady,
    onClose,
    spreadsheetLinked,
  });

  const availableTabs = [
    { id: 'upload', name: 'Upload CSV', icon: CloudArrowUpIcon },
  ];

  if (validationTransactions.length > 0) {
    availableTabs.push({ 
      id: 'validate', 
      name: `Validate (${validationProps.validatedCount}/${validationTransactions.length})`, 
      icon: CheckIcon 
    });
  }

  availableTabs.push({ id: 'settings', name: 'Settings', icon: CogIcon });

  const selectedIndex = availableTabs.findIndex(t => t.id === activeTab);
  const handleTabChange = (index: number) => {
    setActiveTab(availableTabs[index].id as TabType);
  };
  
  const [showMappingGuide, setShowMappingGuide] = useState(false);


  const [createNewSpreadsheetMode, setCreateNewSpreadsheetMode] = useState(false);
  const [newSpreadsheetCurrency, setNewSpreadsheetCurrency] = useState<string>('');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);


  const getLastTransaction = () => {
    if (!userData.transactions || userData.transactions.length === 0) return null;
    const sortedTransactions = [...userData.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sortedTransactions[0];
  };

  const lastTransaction = getLastTransaction();

  const handleCurrencySelection = (selectedCurrency: string) => {
    setNewSpreadsheetCurrency(selectedCurrency);
    updateBaseCurrency(selectedCurrency);
    setShowCurrencySelection(false);
    
    const onSuccess = () => {
        setTimeout(() => {
            onClose();
            window.location.href = '/personal-finance';
        }, 2000);
    };

    setTimeout(() => handleCompleteValidation(onSuccess), 100);
  };

  const onFileSelect = (file: File) => {
    resetCsvState();
    handleAnalyze(file);
  }

  const handleProcessTransactions = () => {
    validateAndProcessData();
  }

  const handleViewDuplicateReport = () => {
    setShowDuplicateReport(true);
  }


  return (
    <>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        <Tab.List className="border-b border-gray-200 -mb-px flex space-x-8">
          {availableTabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                clsx(
                  'py-2 px-1 border-b-2 font-medium text-sm focus:outline-none',
                  selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )
              }
            >
              <tab.icon className="h-5 w-5 inline mr-2" />
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          <Tab.Panel>
             <>
               <SecurityBanner />
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
                 suggestionReasoning={suggestionReasoning}
                 onFileSelect={onFileSelect}
                 onMappingChange={handleMappingChange}
                 onProcessTransactions={handleProcessTransactions}
                 onViewDuplicateReport={handleViewDuplicateReport}
               />
             </>
          </Tab.Panel>

          {validationTransactions.length > 0 && (
            <Tab.Panel>
              <ValidateTransactionsTab
                validationTransactions={validationTransactions}
                paginatedTransactions={validationProps.paginatedTransactions}
                selectedTransactions={validationProps.selectedTransactions}
                editingTransaction={validationProps.editingTransaction}
                editCategory={validationProps.editCategory}
                sortBy={validationProps.sortBy}
                sortDirection={validationProps.sortDirection}
                filterCategory={validationProps.filterCategory}
                showOnlyUnvalidated={validationProps.showOnlyUnvalidated}
                createNewSpreadsheetMode={createNewSpreadsheetMode}
                showCurrencySelection={showCurrencySelection}
                newSpreadsheetCurrency={newSpreadsheetCurrency}
                isProcessing={validationProps.isCompleting}
                isValidatingAllRemaining={validationProps.isValidatingAllRemaining}
                currentPage={validationProps.currentPage}
                pageSize={validationProps.pageSize}
                totalPages={validationProps.totalPages}
                validatedCount={validationProps.validatedCount}
                totalFilteredItems={validationProps.totalFilteredItems}
                onTransactionSelect={validationProps.handleTransactionSelect}
                onSelectAll={validationProps.handleSelectAll}
                onValidateTransaction={validationProps.handleValidateTransaction}
                onValidateSelected={validationProps.handleValidateSelected}
                onValidateAllRemaining={validationProps.handleValidateAllRemaining}
                onEditCategory={validationProps.handleEditCategory}
                onStartEditing={validationProps.startEditingCategory}
                onStopEditing={validationProps.stopEditing}
                onEditCategoryChange={validationProps.setEditCategory}
                onSortChange={validationProps.setSortBy}
                onSortDirectionToggle={() => validationProps.setSortDirection((prev: 'asc' | 'desc') => (prev === 'asc' ? 'desc' : 'asc'))}
                onFilterCategoryChange={validationProps.setFilterCategory}
                onShowOnlyUnvalidatedChange={validationProps.setShowOnlyUnvalidated}
                onCompleteValidation={() => handleCompleteValidation(() => {
                  setTimeout(() => {
                      onClose();
                      window.location.href = '/personal-finance';
                  }, 2000);
                })}
                onCurrencySelection={handleCurrencySelection}
                onPageChange={validationProps.handlePageChange}
                onPageSizeChange={validationProps.handlePageSizeChange}
              />
            </Tab.Panel>
          )}

          <Tab.Panel>
            <SettingsTab
              baseCurrency={baseCurrency}
              onBaseCurrencyChange={updateBaseCurrency}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <CSVMappingGuide
        isVisible={showMappingGuide}
        onClose={() => setShowMappingGuide(false)}
      />

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