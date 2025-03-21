'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LunchMoneySettingsForm() {
  const router = useRouter();
  const [lunchMoneyApiKey, setLunchMoneyApiKey] = useState('');
  const [classifyApiKey, setClassifyApiKey] = useState('');
  const [lunchMoneyStatus, setLunchMoneyStatus] = useState<'loading' | 'valid' | 'invalid' | null>(null);
  const [classifyStatus, setClassifyStatus] = useState<'loading' | 'valid' | 'invalid' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch existing API keys on component mount
  useEffect(() => {
    async function fetchApiKeys() {
      try {
        // Fetch Lunch Money API key status
        const lmResponse = await fetch('/api/lunch-money/credentials');
        if (lmResponse.ok) {
          const data = await lmResponse.json();
          setLunchMoneyStatus(data.hasApiKey ? (data.isValid ? 'valid' : 'invalid') : null);
        }

        // Fetch classification API key 
        const classifyResponse = await fetch('/api/classify/credentials');
        if (classifyResponse.ok) {
          const data = await classifyResponse.json();
          setClassifyStatus(data.hasApiKey ? (data.isValid ? 'valid' : 'invalid') : null);
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
        setError('Failed to load API key information');
      }
    }

    fetchApiKeys();
  }, []);

  // Save Lunch Money API key
  const saveLunchMoneyApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/lunch-money/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: lunchMoneyApiKey }),
      });

      if (response.ok) {
        setSuccessMessage('Lunch Money API key saved successfully!');
        setLunchMoneyStatus('valid');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save Lunch Money API key');
        setLunchMoneyStatus('invalid');
      }
    } catch (error) {
      console.error('Error saving Lunch Money API key:', error);
      setError('An error occurred while saving the API key');
    } finally {
      setIsUpdating(false);
    }
  };

  // Save Classification API key
  const saveClassifyApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/classify/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: classifyApiKey }),
      });

      if (response.ok) {
        setSuccessMessage('Classification API key saved successfully!');
        setClassifyStatus('valid');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save Classification API key');
        setClassifyStatus('invalid');
      }
    } catch (error) {
      console.error('Error saving Classification API key:', error);
      setError('An error occurred while saving the API key');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg">
          {successMessage}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Lunch Money Integration</h2>
        <p className="mb-4 text-gray-600">
          Connect your Lunch Money account by providing your API key. You can find your API key in the 
          <a href="https://my.lunchmoney.app/developers" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer"> Lunch Money Developer Settings</a>.
        </p>

        <form onSubmit={saveLunchMoneyApiKey} className="space-y-4">
          <div>
            <label htmlFor="lunchMoneyApiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Lunch Money API Key
            </label>
            <div className="flex gap-2">
              <input
                id="lunchMoneyApiKey"
                type="password"
                value={lunchMoneyApiKey}
                onChange={(e) => setLunchMoneyApiKey(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Lunch Money API key"
                required
              />
              <button
                type="submit"
                disabled={isUpdating || !lunchMoneyApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>

            {lunchMoneyStatus === 'valid' && (
              <p className="mt-2 text-sm text-green-600">✓ Valid API key configured</p>
            )}
            {lunchMoneyStatus === 'invalid' && (
              <p className="mt-2 text-sm text-red-600">✗ Invalid API key</p>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Transaction Classification Service</h2>
        <p className="mb-4 text-gray-600">
          Connect to the transaction classification service by providing your API key.
        </p>

        <form onSubmit={saveClassifyApiKey} className="space-y-4">
          <div>
            <label htmlFor="classifyApiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Classification API Key
            </label>
            <div className="flex gap-2">
              <input
                id="classifyApiKey"
                type="password"
                value={classifyApiKey}
                onChange={(e) => setClassifyApiKey(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your classification service API key"
                required
              />
              <button
                type="submit"
                disabled={isUpdating || !classifyApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>

            {classifyStatus === 'valid' && (
              <p className="mt-2 text-sm text-green-600">✓ Valid API key configured</p>
            )}
            {classifyStatus === 'invalid' && (
              <p className="mt-2 text-sm text-red-600">✗ Invalid API key</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 