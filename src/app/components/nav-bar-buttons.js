"use client";

import React from "react";
import { LoginButton } from "./buttons/login-button";
import { LogoutButton } from "./buttons/logout-button";
import { SignupButton } from "./buttons/signup-button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export const NavBarButtons = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
      {/* Navigation Links */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
        <Link
          href="/personal-finance"
          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50 min-h-[44px] flex items-center ${
            pathname === "/personal-finance" 
              ? "text-primary bg-primary/5 border border-primary/20" 
              : "text-gray-700 hover:text-primary"
          }`}
        >
          Calculate Your Freedom
        </Link>

      </div>
      
      {/* Authentication Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-4 sm:mt-0 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-200">
        {!session?.user && (
          <>
            <SignupButton />
            <LoginButton />
          </>
        )}
        {session?.user && (
          <>
            <span className="text-sm text-gray-700 font-medium px-3 py-2">
              Welcome, {session.user.name || session.user.email?.split('@')[0] || 'User'}
            </span>
            <LogoutButton />
          </>
        )}
      </div>
    </div>
  );
};
