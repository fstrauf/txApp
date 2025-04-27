'use client';

import { useState, ReactNode } from 'react';

interface Tab {
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsSimpleProps {
  tabs: Tab[];
  initialTab?: number; // Index of the initially active tab
}

export default function TabsSimple({ tabs, initialTab = 0 }: TabsSimpleProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(initialTab);

  return (
    <div className="w-full">
      {/* Tab Buttons */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => !tab.disabled && setActiveTabIndex(index)}
              disabled={tab.disabled}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${
                activeTabIndex === index
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${
                tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-current={activeTabIndex === index ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {tabs.map((tab, index) => (
          <div
            key={tab.label}
            role="tabpanel"
            hidden={activeTabIndex !== index}
          >
            {/* Render content only when active */}
            {activeTabIndex === index && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
} 