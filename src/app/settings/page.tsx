"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/settings/categories" 
          className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Categories</h2>
          <p className="text-muted-foreground">
            Manage your transaction categories. Create new categories, rename existing ones, or delete unused categories.
          </p>
        </Link>
        
        <Link 
          href="/settings/accounts" 
          className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Bank Accounts</h2>
          <p className="text-muted-foreground">
            Manage your bank accounts. Add new accounts, update balances, or remove unused accounts.
          </p>
        </Link>
        
        <Link 
          href="/settings/profile" 
          className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <p className="text-muted-foreground">
            Update your profile information and preferences.
          </p>
        </Link>
      </div>
    </div>
  );
} 