'use client';

import Link from 'next/link';
import TransactionList from './components/transaction-list';
import { useState } from 'react';
import HelpTooltip from '@/components/shared/HelpTooltip';
import HelpDrawer from '@/components/shared/HelpDrawer';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LunchMoneySettingsClientPage from './settings/LunchMoneySettingsClientPage';
import AnalyzeTabContent from './components/AnalyzeTabContent';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function LunchMoneyPage() {
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [queryClient] = useState(() => new QueryClient());

  const tabs = ['Train & Categorize', 'Analyze', 'Settings'];

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
        </div>
      </div>

      <QueryClientProvider client={queryClient}>
        <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <TabList className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-4">
            {tabs.map((tabName) => (
              <Tab
                key={tabName}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-md py-2 px-3 text-sm font-medium leading-5',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                    selected
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  )
                }
              >
                {tabName}
              </Tab>
            ))}
          </TabList>
          <div className="mt-2 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <TabPanels>
              <TabPanel>
                 <TransactionList />
              </TabPanel>

              <TabPanel>
                <AnalyzeTabContent />
              </TabPanel>

              <TabPanel>
                <LunchMoneySettingsClientPage />
              </TabPanel>
            </TabPanels>
          </div>
        </TabGroup>
      </QueryClientProvider>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Got Feedback? Shoot us an{' '}
          <a 
            href="mailto:f.strauf@gmail.com" 
            className="text-blue-600 hover:underline"
          >
            email
          </a>{' '}
          or ping us on{' '}
          <a 
            href="https://t.me/ffstrauf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline"
          >
            Telegram
          </a>.
        </p>
      </div>

      <HelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={() => setIsHelpDrawerOpen(false)}
        title="About the Lunch Money Dashboard"
      >
        <div className="space-y-4">
          <p>This dashboard helps you manage transactions imported from your connected Lunch Money account.</p>
          <p>Use the tabs to navigate between different sections:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Train & Categorize:</strong> View transactions, train your classification model, and categorize new expenses.</li>
            <li><strong>Analyze:</strong> (Coming Soon) View insights and analytics based on your transaction data.</li>
            <li><strong>Settings:</strong> Configure your Lunch Money API key and manage connection settings.</li>
          </ul>
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