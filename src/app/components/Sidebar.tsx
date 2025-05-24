"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useFeatureFlagEnabled } from 'posthog-js/react';

// Define the navigation links for the sidebar
const sidebarNavItems = [
  {
    title: "F-You Money Sheet",
    href: "/fuck-you-money-sheet",
  },
  {
    title: "LunchMoney",
    href: "/lunchmoney",
  },
  {
    title: "Blog",
    href: "/blog",
  },
  {
    title: "AutoAccountant",
    href: "/auto-accountant", // Placeholder path
    featureFlag: 'betaFeature'
  },
  {
    title: "Import",
    href: "/import-transactions",
    featureFlag: 'betaFeature'
  },
  {
    title: "Try Our API",
    href: "/api-landing",
  },
  {
    title: "API Key",
    href: "/api-key",
  },
  {
    title: "Profile",
    href: "/profile",
  },
  // Add more links as needed
];

export function Sidebar() {
  const pathname = usePathname();
  const isBetaFeatureEnabled = useFeatureFlagEnabled('betaFeature');

  // Restore filtering
  const enabledNavItems = sidebarNavItems.filter(item => {
    if (!item.featureFlag) {
      // Always show items without a feature flag
      return true;
    }
    if (item.featureFlag === 'betaFeature') {
      // Only show if the 'betaFeature' flag is enabled
      // The '?? false' handles cases where the hook might initially return undefined/null
      return isBetaFeatureEnabled ?? false;
    }
    // Default case (though unnecessary with current items)
    return true;
  });

  return (
    <aside className="hidden md:block md:w-64 shrink-0 border-r border-gray-200 bg-white p-4">
      <nav className="flex flex-col space-y-2">
        {/* Map over the FILTERED items */}
        {enabledNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 