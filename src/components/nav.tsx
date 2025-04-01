"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          <span className="font-bold">Finance Tracker</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/pricing" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Pricing
          </Link>
          {session ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/transactions" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Transactions
              </Link>
              <Link
                href="/lunch-money/transactions"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/lunch-money") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Lunch Money
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/analytics") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/settings"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/settings") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Settings
              </Link>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                className="text-sm font-medium text-muted-foreground"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 