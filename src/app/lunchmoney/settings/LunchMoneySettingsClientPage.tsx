'use client';

import { useState, useEffect, useCallback } from 'react';
import LunchMoneySettingsForm from '@/components/lunch-money/settings-form';
import Link from 'next/link';
// Import the component from the api-key page
import ApiKeyManager from '@/app/api-key/ApiKeyManager';

// Define the structure of the user profile data we expect
interface UserProfile {
  id: string; // Make sure ID is included
  apiKey: string | null;
  lunchMoneyApiKey: string | null;
  subscriptionStatus: string | null;
  // Add other fields if needed by ApiKeyManager, e.g., subscriptionPlan
  subscriptionPlan?: string | null; 
}

// Remove the placeholder StartTrialButton
// const StartTrialButton = ... 

export default function LunchMoneySettingsClientPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      // Expect the response to have a 'user' property
      const responseData = await response.json();
      const user = responseData.user;

      if (!user) { // Add a check in case the 'user' object is missing
          throw new Error('User data not found in API response');
      }
      
      console.log('User profile data:', user); // Log the actual user object
      setUserProfile(user as UserProfile); // Set state with the nested user object
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings data.');
      setUserProfile(null); // Clear profile on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <main className="container mx-auto px-4 py-8 md:py-16 max-w-3xl">
      <div className="mb-6">
        <Link href="/lunchmoney" className="text-blue-600 hover:underline">
          &larr; Back to Lunch Money Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Lunch Money Settings</h1> {/* Increased bottom margin */} 
      
      {isLoading && <p>Loading settings...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && userProfile && (
        <div className="space-y-12"> {/* Add vertical space between sections */} 
          
          {/* Section 1: Lunch Money API Key Form */}
          <section>
            <h2 className="text-2xl font-semibold mb-3 border-b pb-2">Lunch Money Connection</h2>
            <p className="text-gray-600 mb-6">Enter the API key from your Lunch Money account settings page to import transactions.</p>
            <LunchMoneySettingsForm initialApiKey={userProfile.lunchMoneyApiKey} />
          </section>

          {/* Section 2: App Subscription & API Key (Conditional) */}
          {/* Show this section only if the user DOES NOT have an app API key */} 
          {!userProfile.apiKey && (
            <section>
              <h2 className="text-2xl font-semibold mb-3 border-b pb-2">App Subscription & API Key</h2>
              <p className="text-gray-600 mb-6">
                An active subscription is required to use AI features like transaction training and categorization with Lunch Money.
                Start a free trial or manage your plan below to generate your app API key needed for these features.
              </p>
              {/* Render ApiKeyManager, passing the userId */}
              <ApiKeyManager userId={userProfile.id} />
            </section>
          )}
        </div>
      )}
    </main>
  );
} 