"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Account {
  id: string;
  accountNo: string;
  name: string;
  currency: string;
  balance: number;
  availableFunds: number;
  type: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/basiq/accounts", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch accounts");
        }

        const data = await response.json();
        setAccounts(data.data || []);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-8">Loading Your Accounts...</h1>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Error Loading Accounts</h1>
        <p className="mb-4 text-red-500">{error}</p>
        <Link
          href="/banking"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </Link>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">No Accounts Found</h1>
        <p className="mb-8">You don't have any connected bank accounts yet.</p>
        <Link
          href="/banking"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Connect an Account
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Your Connected Accounts</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-2">{account.name}</h2>
            <p className="text-gray-600 mb-4">{account.accountNo}</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-lg font-medium">
                  {new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: account.currency || 'AUD'
                  }).format(account.balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-lg font-medium">
                  {new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: account.currency || 'AUD'
                  }).format(account.availableFunds)}
                </p>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {account.type}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <Link
          href="/banking"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-block"
        >
          Connect Another Account
        </Link>
      </div>
    </div>
  );
} 