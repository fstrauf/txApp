'use client';

import Link from 'next/link';
import TransactionList from '@/components/lunch-money/transaction-list';

export default function LunchMoneyPage() {

  return (
    <main className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lunch Money Dashboard</h1>
        <Link 
          href="/lunchmoney/settings" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Settings
        </Link>
      </div>

      {/* Render the TransactionList component - it handles its own fetching and display */}
      <TransactionList />
    </main>
  );
} 