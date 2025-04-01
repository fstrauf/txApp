"use client";

import React from "react";
import { LoginButton } from "./buttons/login-button";
import { LogoutButton } from "./buttons/logout-button";
import { SignupButton } from "./buttons/signup-button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import AddOnButton from "./buttons/AddOnButton";

export const NavBarButtons = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Primary CTA - Install Add-on (visible to everyone) */}
      <AddOnButton size="md" variant="primary" />
      
      {/* Secondary link - Free Template */}
      <Link
        href="/fuck-you-money-sheet"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/fuck-you-money-sheet" ? "text-primary" : "text-gray-700"
        }`}
      >
        Free Template
      </Link>
      
      <Link
        href="/pricing"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/pricing" ? "text-primary" : "text-gray-700"
        }`}
      >
        Pricing
      </Link>
      
      {!session?.user && (
        <>
          <SignupButton />
          <LoginButton />
        </>
      )}
      {session?.user && (
        <div className="flex items-center gap-3">
          <Link
            href="/api-key"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/api-key" ? "text-primary" : "text-gray-700"
            }`}
          >
            API Key
          </Link>
          <LogoutButton />
          <Link
            href="/profile"
            className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden shadow-soft hover:shadow-glow transition-all duration-200 bg-gray-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-6 h-6 text-gray-600"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};
