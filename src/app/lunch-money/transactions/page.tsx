import { Suspense } from 'react';
import TransactionList from '@/components/lunch-money/transaction-list';
import Link from 'next/link';

export default function LunchMoneyTransactionsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lunch Money Transactions</h1>
        <div className="space-x-4">
          <Link 
            href="/lunch-money/settings" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Settings
          </Link>
          <Link 
            href="/lunch-money/classify" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Classify Transactions
          </Link>
          <Link 
            href="/lunch-money/debug-raw" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug API
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <Suspense fallback={<div>Loading transactions...</div>}>
          <TransactionList />
        </Suspense>
      </div>
    </div>
  );
} 