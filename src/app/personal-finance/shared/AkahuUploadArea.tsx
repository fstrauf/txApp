'use client';

import React, { useState, useEffect } from 'react';
import { akahuService, AkahuAccount, AkahuConnection, AkahuService } from '@/lib/akahu';

export interface AkahuUploadAreaProps {
  onTransactionsSelect: (transactions: any[]) => void;
  className?: string;
}

export const AkahuUploadArea: React.FC<AkahuUploadAreaProps> = ({ 
  onTransactionsSelect, 
  className = "" 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<AkahuConnection[]>([]);
  const [accounts, setAccounts] = useState<AkahuAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [step, setStep] = useState<'connect' | 'select' | 'import' | 'success'>('connect');
  const [error, setError] = useState<string | null>(null);
  const [transactionPeriod, setTransactionPeriod] = useState(12); // months

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Test connection first
      const isConnected = await akahuService.testConnection();
      if (!isConnected) {
        setError('Unable to connect to Akahu. Please check your API configuration.');
        return;
      }

      const [connectionsData, accountsData] = await Promise.all([
        akahuService.getConnections(),
        akahuService.getAccounts()
      ]);
      
      setConnections(connectionsData);
      setAccounts(accountsData);
      
      if (connectionsData.length > 0) {
        setStep('select');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleImportTransactions = async () => {
    if (selectedAccounts.length === 0) {
      setError('Please select at least one account');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('import');

      console.log('Starting transaction import for accounts:', selectedAccounts);
      const transactions = await akahuService.getRecentTransactions(
        selectedAccounts, 
        transactionPeriod
      );

      console.log('Raw transactions received:', transactions.length);
      const formattedTransactions = AkahuService.formatTransactionsForAnalysis(transactions);
      console.log('Formatted transactions:', formattedTransactions.length);
      
      // Call the parent callback
      onTransactionsSelect(formattedTransactions);
      
      // Set step to success instead of staying in import
      setStep('success');
      console.log('Transaction import completed successfully');
    } catch (err) {
      console.error('Transaction import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to import transactions');
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const renderConnectStep = () => (
    <div className="text-center">
      <div className="text-6xl mb-6">🏦</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Bank Account</h3>
      <p className="text-gray-600 mb-6">
        Securely connect your bank account to automatically import your transactions
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <button
        onClick={loadConnections}
        disabled={isLoading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Connecting...' : 'Connect Bank Account'}
      </button>
      
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {['ANZ', 'ASB', 'Westpac', 'BNZ', 'Kiwibank', 'TSB'].map((bank) => (
          <div key={bank} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <div className="font-semibold text-gray-800">{bank}</div>
            <div className="text-xs">Supported</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelectStep = () => (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Connected Successfully!</h3>
        <p className="text-gray-600">Select the accounts you want to analyze</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Transaction Period Selector */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Import transactions from the last:
        </label>
        <select
          value={transactionPeriod}
          onChange={(e) => setTransactionPeriod(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
          <option value={24}>24 months</option>
        </select>
      </div>

      {/* Account Selection */}
      <div className="space-y-3 mb-6">
        {accounts.map((account) => {
          const connection = connections.find(c => c._id === account.connection._id);
          return (
            <div
              key={account._id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedAccounts.includes(account._id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAccountToggle(account._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account._id)}
                    onChange={() => handleAccountToggle(account._id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {account.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {connection?.name} • {account.formatted_account || 'Account'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">
                    ${account.balance?.current?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {account.type.toLowerCase().replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleImportTransactions}
        disabled={selectedAccounts.length === 0 || isLoading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Importing Transactions...' : `Import Transactions (${selectedAccounts.length} account${selectedAccounts.length !== 1 ? 's' : ''})`}
      </button>
    </div>
  );

  const renderImportStep = () => (
    <div className="text-center">
      <div className="text-6xl mb-6">⏳</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Importing Transactions</h3>
      <p className="text-gray-600 mb-6">
        We're securely importing your transactions from the selected accounts...
      </p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Transactions Imported Successfully!</h3>
      <p className="text-gray-600 mb-6">
        Your transactions have been imported and are ready for analysis.
      </p>
      <button
        onClick={() => {
          // Reset to allow another import
          setStep('select');
          setSelectedAccounts([]);
          setError(null);
        }}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
      >
        Import More Transactions
      </button>
    </div>
  );

  return (
    <div className={`text-center my-10 ${className}`}>
      <div className="border-2 border-dashed border-indigo-400 bg-indigo-50 rounded-2xl p-8">
        {step === 'connect' && renderConnectStep()}
        {step === 'select' && renderSelectStep()}
        {step === 'import' && renderImportStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
      
      <div className="mt-6 p-5 bg-green-50 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center">
          <span className="text-xl mr-3">🔒</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">Bank-level security</div>
            <div className="text-xs text-gray-600">
              Powered by Akahu - your banking data is encrypted and never stored permanently.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
