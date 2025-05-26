'use client';

import React, { useState } from 'react';
import { CSVUploadArea } from '@/app/personal-finance/shared/CSVUploadArea';
import { AkahuUploadArea } from '@/app/personal-finance/shared/AkahuUploadArea';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

type UploadMethod = 'csv' | 'akahu';

const SpendingAnalysisUploadScreen: React.FC = () => {
  const { goToScreen } = useScreenNavigation();
  const { processTransactionData } = usePersonalFinanceStore();
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('csv');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importedTransactions, setImportedTransactions] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setImportedTransactions(null); // Clear any Akahu transactions
  };

  const handleTransactionsSelect = (transactions: any[]) => {
    setImportedTransactions(transactions);
    setUploadedFile(null); // Clear any CSV file
    
    // Process transaction data and update the store
    processTransactionData(transactions);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !importedTransactions) return;
    
    setIsProcessing(true);
    
    // Simulate file processing or use imported transactions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to results screen
    goToScreen('spendingAnalysisResults');
  };

  const hasData = uploadedFile || (importedTransactions && importedTransactions.length > 0);

  const handleSkip = () => {
    goToScreen('initialInsights');
  };

  function prevScreen(): void {
    goToScreen('initialInsights');
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">Deep Dive: Spending Analysis</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Upload Your Bank Transactions
          </h1>
          <p className="text-lg text-gray-600">
            Get detailed insights into your spending patterns and discover opportunities to save
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-indigo-600">Import Data</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Analyze</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Results</span>
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Choose your preferred method:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              // onClick={() => setUploadMethod('akahu')}
              className={`p-6 rounded-xl border-2 transition-all relative ${
                uploadMethod === 'akahu'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 opacity-75'
              }`}
              disabled
            >
              {/* Coming Soon Badge */}
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Coming Soon
              </div>
              
              <div className="text-4xl mb-3">🏦</div>
              <h4 className="font-semibold text-gray-800 mb-2">Connect Bank Account</h4>
              <p className="text-sm text-gray-600">
                Automatically import transactions securely via Akahu
              </p>
              <div className="mt-3 text-xs text-gray-500 font-medium">
                ✓ Recommended • Most accurate
              </div>
            </button>

            <button
              onClick={() => setUploadMethod('csv')}
              className={`p-6 rounded-xl border-2 transition-all ${
                uploadMethod === 'csv'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-3">📄</div>
              <h4 className="font-semibold text-gray-800 mb-2">Upload CSV File</h4>
              <p className="text-sm text-gray-600">
                Export transactions from your online banking
              </p>
              <div className="mt-3 text-xs text-gray-500">
                Manual export required
              </div>
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          {uploadMethod === 'csv' ? (
            <CSVUploadArea onFileSelect={handleFileSelect} />
          ) : (
            <AkahuUploadArea onTransactionsSelect={handleTransactionsSelect} />
          )}
          
          {uploadedFile && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
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

          {importedTransactions && importedTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                <div>
                  <div className="font-semibold text-gray-800">Transactions imported successfully!</div>
                  <div className="text-sm text-gray-600">
                    {importedTransactions.length} transactions ready for analysis
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What We'll Analyze */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            What we'll analyze for you:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h4 className="font-semibold text-gray-800">Spending Categories</h4>
                <p className="text-sm text-gray-600">Automatically categorize all your transactions into groceries, dining, transport, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-2xl mr-3">📈</span>
              <div>
                <h4 className="font-semibold text-gray-800">Spending Trends</h4>
                <p className="text-sm text-gray-600">See how your spending changes over time and identify patterns.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h4 className="font-semibold text-gray-800">Saving Opportunities</h4>
                <p className="text-sm text-gray-600">Find specific areas where you could reduce spending.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <h4 className="font-semibold text-gray-800">Benchmarking</h4>
                <p className="text-sm text-gray-600">Compare your spending to others in similar situations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Export - Only show for CSV method */}
        {uploadMethod === 'csv' && (
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              How to export from your bank:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">ANZ</h4>
                <p className="text-sm text-gray-600">Internet Banking → Accounts → Export → CSV</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">ASB</h4>
                <p className="text-sm text-gray-600">FastNet Classic → Account Activity → Export</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Westpac</h4>
                <p className="text-sm text-gray-600">Online Banking → Statements → Download CSV</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">BNZ</h4>
                <p className="text-sm text-gray-600">Internet Banking → Accounts → Export → CSV</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PrimaryButton
            variant="secondary"
            onClick={handleSkip}
            className="sm:w-auto"
          >
            Skip for Now
          </PrimaryButton>
          
          <PrimaryButton
            onClick={handleAnalyze}
            disabled={!hasData || isProcessing}
            className="sm:flex-1"
          >
            {isProcessing ? 'Analyzing...' : hasData ? 'Analyze My Spending →' : 'Import Data First'}
          </PrimaryButton>
        </div>

        {/* Navigation Buttons - Consistent at Bottom */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
          <PrimaryButton
            onClick={prevScreen}
            variant="secondary"
            className="w-full sm:w-48 order-1 sm:order-1"
          >
            Back
          </PrimaryButton>
          <PrimaryButton
            onClick={handleSkip}
            className="w-full sm:w-48 order-2 sm:order-2"
          >
            Skip for now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalysisUploadScreen;
