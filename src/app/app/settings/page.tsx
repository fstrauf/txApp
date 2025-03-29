"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        Please <Link href="/auth/signin">sign in</Link> to view this page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Categories</h2>
          <p className="mb-4 text-gray-600">Manage your transaction categories and set budgets.</p>
          <Link 
            href="/settings/categories" 
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Manage Categories
          </Link>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Bank Accounts</h2>
          <p className="mb-4 text-gray-600">
            Connect and manage your bank accounts for automatic transaction import.
          </p>
          <Link 
            href="/settings/accounts" 
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Manage Accounts
          </Link>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Lunch Money</h2>
          <p className="mb-4 text-gray-600">
            Connect your Lunch Money account to import and categorize transactions.
          </p>
          <Link 
            href="/lunch-money/settings" 
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Lunch Money Settings
          </Link>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Profile</h2>
          <p className="mb-4 text-gray-600">
            Manage your profile settings and account preferences.
          </p>
          <Link 
            href="/settings/profile" 
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
} 