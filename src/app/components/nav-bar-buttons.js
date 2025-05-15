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
        href="/api-landing"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/api-landing" ? "text-primary" : "text-gray-700"
        }`}
      >
        Try Our API
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
          <LogoutButton />
        </div>
      )}
    </div>
  );
};
