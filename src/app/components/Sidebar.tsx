"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useFeatureFlagEnabled } from 'posthog-js/react';

// Define the navigation links for the sidebar
const sidebarNavItems = [
  {
    title: "Personal Finance",
    href: "/personal-finance",
    icon: "💳",
  },
  {
    title: "F-You Money Sheet",
    href: "/fuck-you-money-sheet",
    icon: "📊",
  },
  {
    title: "LunchMoney",
    href: "/lunchmoney",
    icon: "🍕",
  },
  {
    title: "Blog",
    href: "/blog",
    icon: "📝",
  },
  {
    title: "AutoAccountant",
    href: "/auto-accountant",
    icon: "🤖",
    featureFlag: 'betaFeature'
  },
  {
    title: "Import",
    href: "/import-transactions",
    icon: "📥",
    featureFlag: 'betaFeature'
  },
  {
    title: "Try Our API",
    href: "/api-landing",
    icon: "🔗",
  },
  {
    title: "API Key",
    href: "/api-key",
    icon: "🔑",
  },
  {
    title: "Profile",
    href: "/profile",
    icon: "👤",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isBetaFeatureEnabled = useFeatureFlagEnabled('betaFeature');
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default

  // Don't show general sidebar on personal finance pages
  const isPersonalFinancePage = pathname.startsWith('/personal-finance');
  if (isPersonalFinancePage) {
    return null;
  }

  // Restore filtering
  const enabledNavItems = sidebarNavItems.filter(item => {
    if (!item.featureFlag) {
      return true;
    }
    if (item.featureFlag === 'betaFeature') {
      return isBetaFeatureEnabled ?? false;
    }
    return true;
  });

  return (
    <aside className={`hidden md:block shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ${
      isCollapsed ? 'md:w-16' : 'md:w-64'
    }`}>
      <div className="p-4">
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors mb-4"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span className="ml-2 text-sm font-medium">Collapse</span>}
        </button>

        {/* Navigation */}
        <nav className="flex flex-col space-y-2">
          {enabledNavItems.map((item) => (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.title}</span>
                )}
              </Link>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                  <div className="bg-gray-900 text-white text-sm px-2 py-1 rounded-md whitespace-nowrap">
                    {item.title}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
} 