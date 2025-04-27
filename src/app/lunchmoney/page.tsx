'use client';

import Link from 'next/link';
import TransactionList from './components/transaction-list';
import { useState } from 'react';
import HelpTooltip from '@/components/shared/HelpTooltip';
import HelpDrawer from '@/components/shared/HelpDrawer';

export default function LunchMoneyPage() {
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);

  return (
    <main className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">Lunch Money Dashboard</h1>
          <HelpTooltip content="View and manage transactions imported from your Lunch Money account." />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsHelpDrawerOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Explain This Page
          </button>
          <Link 
            href="/lunchmoney/settings" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Settings
          </Link>
        </div>
      </div>

      <TransactionList />

      <HelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={() => setIsHelpDrawerOpen(false)}
        title="About the Lunch Money Dashboard"
      >
        <div className="space-y-4">
          <p>This page displays transactions imported from your connected Lunch Money account.</p>
          <p>Use the <strong>Settings</strong> button to configure your Lunch Money API key if you haven't already.</p>
          <p>The list below shows your recent transactions. You can use this data for further analysis or processing within this application.</p>
          <p>The core features for expense categorisation are training and categorisation:</p>
          <ul className="space-y-2">
            <li><strong>Training:</strong> train your custom model with all you transactions and correct categorisation. We recommend using as many transaction as possible here. A label will appear next to transactions that are included in the training set.</li>
            <li><strong>Categorisation:</strong> Automatically categorise transactions based on the training set. This will generate suggestions, that you can choose to apply.</li>
          </ul>
        </div>
      </HelpDrawer>
    </main>
  );
} 