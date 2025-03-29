'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LunchMoneySettingsPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current API key status
  useEffect(() => {
    const fetchApiKeyStatus = async () => {
      try {
        const response = await fetch('/api/lunch-money/credentials');
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch credentials');
        }
        
        const data = await response.json();
        setHasApiKey(data.hasLunchMoneyApiKey);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred while fetching credentials');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApiKeyStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    try {
      const response = await fetch('/api/lunch-money/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save credentials');
      }
      
      setSuccess('API key saved successfully!');
      setHasApiKey(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!confirm('Are you sure you want to remove your Lunch Money API key?')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    try {
      const response = await fetch('/api/lunch-money/credentials', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove credentials');
      }
      
      setSuccess('API key removed successfully!');
      setHasApiKey(false);
      setApiKey('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lunch Money Settings</h1>
        <div className="space-x-4">
          <Link 
            href="/lunch-money/transactions" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Transactions
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                To connect with Lunch Money, you need to provide your API key.
                You can get one by going to <a href="https://my.lunchmoney.app/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Lunch Money Developer Settings</a>.
              </p>
              
              <p className="text-gray-600">
                {hasApiKey 
                  ? 'Your Lunch Money account is connected.' 
                  : 'You need to connect your Lunch Money account to use this feature.'
                }
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  Lunch Money API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={hasApiKey ? "••••••••••••••••" : "Enter your API key"}
                  required={!hasApiKey}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={saving || (!apiKey && hasApiKey)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? 'Saving...' : hasApiKey ? 'Update API Key' : 'Save API Key'}
                </button>
                
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
                  >
                    {saving ? 'Removing...' : 'Remove API Key'}
                  </button>
                )}
              </div>
            </form>
            
            {hasApiKey && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">What you can do with your Lunch Money connection:</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>View and import your Lunch Money transactions</li>
                  <li>Categorize transactions using your own custom categories</li>
                  <li>Train a classification model to automatically categorize future transactions</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 