'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import hooks
import LunchMoneySettingsForm from '../components/settings-form';
import Link from 'next/link';
// Import the component from the api-key page
import ApiKeyManager from '@/app/api-key/ApiKeyManager';
import TabsSimple from '@/components/ui/tabs-simple';

// Define the structure of the user profile data we expect
interface UserProfile {
  id: string; // Make sure ID is included
  api_key: string | null;
  lunchMoneyApiKey: string | null;
  subscriptionStatus: string | null;
  // Add other fields if needed by ApiKeyManager, e.g., subscriptionPlan
  subscriptionPlan?: string | null; 
}

// Define the fetch function separately
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    // Attempt to parse error message from API
    let errorMsg = 'Failed to fetch user profile';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (parseError) { /* Ignore if parsing fails */ }
    throw new Error(errorMsg);
  }
  const responseData = await response.json();
  const user = responseData.user;
  if (!user) {
    throw new Error('User data not found in API response');
  }
  console.log('Fetched User profile data via React Query:', user);
  return user as UserProfile;
};

export default function LunchMoneySettingsClientPage() {
  // Use useQuery to fetch and manage the user profile state
  const queryClient = useQueryClient(); // Get query client instance
  const { 
    data: userProfile, 
    isLoading, 
    error, 
    // refetch // We usually invalidate instead of manually refetching
  } = useQuery<UserProfile, Error>({ // Explicitly type the error
    queryKey: ['userProfile'], // Unique key for this query
    queryFn: fetchUserProfile, // Function to fetch data
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on focus
  });

  // Callback to invalidate the queries
  const invalidateUserDataQueries = useCallback(() => {
    if (!userProfile?.id) return; // Need user ID to invalidate accountInfo
    console.log('Invalidating userProfile and accountInfo queries...');
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    queryClient.invalidateQueries({ queryKey: ['accountInfo', userProfile.id] });
  }, [queryClient, userProfile?.id]); // Depend on userProfile.id

  // Define tab content conditionally based on userProfile from useQuery
  const getTabs = () => {
    // Handle loading and error states before accessing userProfile
    if (isLoading) return []; // Or return loading indicator content
    if (error) return []; // Or return error message content
    if (!userProfile) return []; // Should be covered by isLoading/error, but good practice

    const apiSettingsContent = (
      <div className="space-y-8">
        {/* --- Step 1: Lunch Money Connection --- */}
        <section className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1 flex items-center">
            <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 text-sm">1</span>
            Connect Your Lunch Money Account
          </h2>
          <p className="text-gray-600 mb-6 ml-9">Enter the API key from your Lunch Money account settings page.</p>
          <div className="ml-9">
            <LunchMoneySettingsForm 
              initialApiKey={userProfile.lunchMoneyApiKey} 
              onSuccess={invalidateUserDataQueries} // Pass combined invalidation callback
            />
          </div>
        </section>

        {/* --- Step 2: App Subscription & API Key --- */}
        <section className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1 flex items-center">
            <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 text-sm">2</span>
            Set Up Your App API Key
          </h2>
          <p className="text-gray-600 mb-6 ml-9">
            An active subscription grants access to AI features. Manage your plan and API key below.
          </p>
          <div className="ml-9">
            <ApiKeyManager 
              userId={userProfile.id} 
              onSuccess={invalidateUserDataQueries} // Pass combined invalidation callback
            />
          </div>
        </section>

        {/* --- Step 3: Start Using AI --- */}
        {userProfile.lunchMoneyApiKey && userProfile.api_key && (
          <section className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-1 flex items-center">
              <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center mr-3 text-sm">3</span>
              Start Using AI Features
            </h2>
            <p className="text-gray-600 mb-6 ml-9">
              You're all set! Head back to your Lunch Money dashboard to start training the AI and categorizing transactions.
            </p>
            <div className="ml-9">
              <Link 
                href="/lunchmoney"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Go to Lunch Money Dashboard &rarr;
              </Link>
            </div>
          </section>
        )}
      </div>
    );

    const schedulingContent = (
      <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-4">Automated Categorization & Training</h2>
        <p className="text-gray-600 mb-4">
          <strong>Coming Soon!</strong> Schedule automatic AI categorization and training runs for your Lunch Money transactions.
        </p>
        <p className="text-gray-600">
          Once configured, the system will periodically fetch new transactions, categorize them using your trained AI model, and update them directly in Lunch Money - keeping your finances effortlessly organized.
        </p>
        {/* Add more details or visuals if desired */}
      </div>
    );

    return [
      { label: 'API Setup', content: apiSettingsContent },
      { label: 'Scheduling', content: schedulingContent, disabled: false }, // Keep enabled to show Coming Soon
    ];
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-16 max-w-3xl">
      <div className="mb-6">
        <Link href="/lunchmoney" className="text-blue-600 hover:underline">
          &larr; Back to Lunch Money Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Lunch Money Settings</h1>
      
      {isLoading && <p>Loading settings...</p>}
      {/* Display error message from useQuery */}
      {error && <p className="text-red-500">Error loading settings: {error.message}</p>}

      {!isLoading && !error && userProfile && (
        <TabsSimple tabs={getTabs()} />
      )}
    </main>
  );
} 