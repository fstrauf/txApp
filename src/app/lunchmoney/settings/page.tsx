'use client';

import LunchMoneySettingsForm from '@/components/lunch-money/settings-form';
import Link from 'next/link';

export default function LunchMoneySettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-16 max-w-3xl">
      <div className="mb-6">
        <Link href="/lunchmoney" className="text-blue-600 hover:underline">
          &larr; Back to Lunch Money Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Lunch Money Settings</h1>
      <p className="text-gray-600 mb-8">Manage your Lunch Money API key connection.</p>
      <LunchMoneySettingsForm />
    </main>
  );
} 