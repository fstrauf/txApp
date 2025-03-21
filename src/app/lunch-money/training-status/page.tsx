'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function TrainingStatusPage() {
  const searchParams = useSearchParams();
  
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [message, setMessage] = useState<string>('Initializing training process...');
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [pollCount, setPollCount] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Get prediction ID from URL or localStorage
    const paramId = searchParams.get('prediction_id');
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('training_prediction_id') : null;
    
    const id = paramId || storedId;
    
    if (id) {
      setPredictionId(id);
    } else {
      setError('No prediction ID found. Cannot check training status.');
      setIsPolling(false);
    }
  }, [searchParams]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = async () => {
      if (predictionId && isPolling) {
        // Start polling for status immediately
        await checkStatus();
        
        // Then set up interval for continued polling
        intervalId = setInterval(async () => {
          await checkStatus();
          setPollCount(prev => prev + 1);
          
          // Stop polling after 60 attempts (5 minutes)
          if (pollCount >= 60) {
            setIsPolling(false);
            setMessage('Polling timed out. Training may still be in progress. Check back later.');
            clearInterval(intervalId!);
          }
        }, 5000); // Poll every 5 seconds
      }
    };
    
    startPolling();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [predictionId, isPolling]);

  const checkStatus = async () => {
    if (!predictionId) return;
    
    try {
      const response = await fetch(`https://txclassify.onrender.com/status/${predictionId}`, {
        headers: {
          'X-API-Key': 'test_api_key_fixed',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Training job not found. It may have expired or been removed.');
          setIsPolling(false);
          return;
        }
        
        const errorData = await response.text();
        throw new Error(`Status check failed: ${errorData}`);
      }
      
      const data = await response.json();
      
      // Update state based on response
      if (data.status) {
        setStatus(data.status);
        
        if (data.message) {
          setMessage(data.message);
        }
        
        if (data.result) {
          setResult(data.result);
        }
        
        // Stop polling if we've reached a terminal state
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('Error checking training status:', error);
      setMessage(`Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Don't stop polling immediately on error, unless we've tried many times
      if (pollCount > 10) {
        setIsPolling(false);
        setError('Too many errors while checking training status.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Training Status</h1>
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
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Training Job ID</h2>
              <p className="font-mono bg-gray-100 p-2 rounded">{predictionId || 'Unknown'}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Status</h2>
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'failed' ? 'bg-red-500' :
                    status === 'processing' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}
                />
                <span className="capitalize">{status}</span>
                
                {/* Show spinner if still polling */}
                {isPolling && (
                  <div className="ml-4 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-sm text-gray-500">Checking status...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Message</h2>
              <p className="bg-gray-50 p-3 rounded">{message}</p>
            </div>
            
            {/* Display poll count */}
            <div className="mb-6 text-sm text-gray-500">
              Poll attempts: {pollCount}/60
            </div>
            
            {/* Show result data if available */}
            {result && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Result Data</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Actions based on current status */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => checkStatus()}
                disabled={isPolling}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Refresh Status
              </button>
              
              {(status === 'completed' || status === 'failed' || !isPolling) && (
                <Link 
                  href="/lunch-money/transactions"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Return to Transactions
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 