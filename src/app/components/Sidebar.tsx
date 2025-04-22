"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
    title: "AutoAccountant",
    href: "/auto-accountant", // Placeholder path
  },
  {
    title: "Import",
    href: "/import-transactions", // Placeholder path
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

  return (
    <aside className="hidden md:block md:w-64 flex-shrink-0 border-r border-gray-200 bg-white p-4">
      <nav className="flex flex-col space-y-2">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-primary/10 text-primary" // Active link style
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900" // Inactive link style
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 