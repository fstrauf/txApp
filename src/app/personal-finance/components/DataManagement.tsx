// src/app/personal-finance/components/DataManagement.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Box } from '@/components/ui/Box';

interface DataManagementProps {
  className?: string;
}

export const DataManagement: React.FC<DataManagementProps> = ({ className = '' }) => {
  const { userData, clearAllData, exportData, importData } = usePersonalFinanceStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportedData, setExportedData] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    const data = exportData();
    setExportedData(data);
    setShowExportModal(true);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: 'Please paste your data to import' });
      return;
    }

    const success = importData(importText);
    if (success) {
      setMessage({ type: 'success', text: 'Data imported successfully!' });
      setImportText('');
      setShowImportModal(false);
    } else {
      setMessage({ type: 'error', text: 'Failed to import data. Please check the format.' });
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      clearAllData();
      setMessage({ type: 'success', text: 'All data cleared successfully' });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const hasData = userData.income > 0 || userData.spending > 0 || userData.savings > 0 || 
                  (userData.transactions && userData.transactions.length > 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status */}
      <Box variant="default" className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          💾 Data Storage Status
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleExport}
          disabled={!hasData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          📤 Export Data
        </button>
        
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          📥 Import Data
        </button>
        
        <button
          onClick={handleClearData}
          disabled={!hasData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-2 text-xs underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Export Your Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Copy this data to save as a backup or transfer to another device
              </p>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <textarea
                value={exportedData}
                readOnly
                className="w-full h-64 p-3 border rounded text-xs font-mono bg-gray-50"
                placeholder="Your exported data will appear here..."
              />
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => copyToClipboard(exportedData)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
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
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Import Data
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
