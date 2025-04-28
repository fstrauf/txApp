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
          <p>Lunch Money groups transactions into those you have reviewed (e.g. adjusted categories) and those you have not.</p>
          <p>This perfectly matches the functionality of the <strong>Training</strong> and <strong>Categorisation</strong> features:</p>
          <ul className="space-y-2">
            <li><strong>Training:</strong> train you custom model with all your reviewed transactions. This will be your base going forward for suggesting categories on new transactions.</li>
            <li><strong>Categorisation:</strong> suggest categories for all transactions you have not reviewed yet, based on your historical categorisations.</li>
          </ul>
        </div>
      </HelpDrawer>
    </main>
  );
} 