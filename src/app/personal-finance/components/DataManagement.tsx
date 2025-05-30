// src/app/personal-finance/components/DataManagement.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { Box } from '@/components/ui/Box';
import { Button } from '@/components/ui/button';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, TrashIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import ExportFeedbackDialog from '@/components/shared/ExportFeedbackDialog';

interface DataManagementProps {
  className?: string;
}

export const DataManagement: React.FC<DataManagementProps> = ({ className = '' }) => {
  const { userData, clearAllData, importData } = usePersonalFinanceStore();
  const { trackAction } = usePersonalFinanceTracking({
    currentScreen: 'dataManagement',
    progress: 100
  });
  const [showExportFeedbackDialog, setShowExportFeedbackDialog] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportFeedback = () => {
    setShowExportFeedbackDialog(true);
    
    // Track export interest
    trackAction('exportFeedbackRequested', {
      has_income: userData.income > 0,
      has_spending: userData.spending > 0,
      has_savings: userData.savings > 0,
      transaction_count: userData.transactions?.length || 0
    });
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: 'Please paste your data to import' });
      trackAction('dataImportFailed', {
        reason: 'empty_input',
        input_length: importText.length
      });
      return;
    }

    const success = importData(importText);
    if (success) {
      setMessage({ type: 'success', text: 'Data imported successfully!' });
      setImportText('');
      setShowImportModal(false);
      
      // Track successful import
      trackAction('dataImported', {
        input_length: importText.length,
        success: true
      });
    } else {
      setMessage({ type: 'error', text: 'Failed to import data. Please check the format.' });
      
      // Track failed import
      trackAction('dataImportFailed', {
        reason: 'invalid_format',
        input_length: importText.length
      });
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      // Track data before clearing
      const dataBeforeClear = {
        had_income: userData.income > 0,
        had_spending: userData.spending > 0,
        had_savings: userData.savings > 0,
        transaction_count: userData.transactions?.length || 0
      };
      
      clearAllData();
      setMessage({ type: 'success', text: 'All data cleared successfully' });
      
      // Track clear action
      trackAction('dataCleared', dataBeforeClear);
    }
  };

  const hasData = userData.income > 0 || userData.spending > 0 || userData.savings > 0 || 
                  (userData.transactions && userData.transactions.length > 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status */}
      <Box variant="default" className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          <CircleStackIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> Data Storage Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Income:</span>
            <span className="font-medium">{userData.income > 0 ? `$${userData.income.toLocaleString()}` : 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Spending:</span>
            <span className="font-medium">{userData.spending > 0 ? `$${userData.spending.toLocaleString()}` : 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Savings:</span>
            <span className="font-medium">{userData.savings > 0 ? `$${userData.savings.toLocaleString()}` : 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transactions:</span>
            <span className="font-medium">{userData.transactions?.length || 0} imported</span>
          </div>
        </div>
        
        {hasData && (
          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
            ✅ Your data is automatically saved locally and will persist across browser sessions
          </div>
        )}
      </Box>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={handleExportFeedback}
          disabled={!hasData}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Export Data
        </Button>
        
        {/* <Button
          onClick={() => setShowImportModal(true)}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Import Data
        </Button> */}
        
        <Button
          onClick={handleClearData}
          disabled={!hasData}
          className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <Button
            onClick={() => setMessage(null)}
            className="ml-2 text-xs underline bg-transparent p-0 shadow-none hover:bg-transparent text-current"
          >
            dismiss
          </Button>
        </div>
      )}

      {/* Export Feedback Dialog */}
      <ExportFeedbackDialog
        isOpen={showExportFeedbackDialog}
        onClose={() => setShowExportFeedbackDialog(false)}
        onFeedbackSubmitted={() => {
          setMessage({ type: 'success', text: 'Thanks for your feedback! We\'ll notify you when export is ready.' });
          
          // Track feedback submission
          trackAction('exportFeedbackSubmitted', {
            has_data: hasData,
            transaction_count: userData.transactions?.length || 0
          });
        }}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Import Your Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Paste your exported data below to restore it
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 p-3 border rounded text-xs font-mono"
                placeholder="Paste your exported data here..."
              />
            </div>
            <div className="p-4 border-t flex gap-2">
              {/* <Button
                onClick={handleImport}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Import Data
              </Button> */}
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
