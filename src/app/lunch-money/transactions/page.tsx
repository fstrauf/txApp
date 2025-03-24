"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import TransactionList from '@/components/lunch-money/transaction-list';

export default function LunchMoneyTransactionsPage() {
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lunch Money Transactions</h1>
        <div className="flex space-x-2">
          <Link
            href="/lunch-money/settings"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Settings
          </Link>
        </div>
      </div>

      <Suspense fallback={<div>Loading transactions...</div>}>
        <TransactionList />
      </Suspense>
    </div>
  );
} 