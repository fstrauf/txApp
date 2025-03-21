'use client';

import { useState } from 'react';

export default function TestLunchMoneyApi() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRawData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/lunch-money/raw-transactions');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch raw data');
      }
      
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lunch Money API Test</h1>
      
      <button 
        onClick={fetchRawData}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading ? 'Loading...' : 'Fetch Raw Transaction Data'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {apiResponse && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[80vh]">
            <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
} 