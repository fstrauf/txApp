'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';
import { sentryFetch } from '@/lib/sentry-api-client';

export default function SentryTestComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testFrontendError = () => {
    try {
      // Add breadcrumb before error
      Sentry.addBreadcrumb({
        category: 'user',
        message: 'User clicked frontend error test button',
        level: 'info',
      });

      // Intentionally throw an error
      throw new Error('This is a test frontend error!');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          section: 'frontend',
          component: 'SentryTestComponent',
        },
        extra: {
          action: 'test_button_click',
          timestamp: new Date().toISOString(),
        },
      });

      setResult('Frontend error captured! Check your Sentry dashboard.');
    }
  };

  const testApiRequest = async () => {
    setLoading(true);
    try {
      // Test the API with Sentry monitoring
      const response = await sentryFetch('/api/sentry-test', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data.message || 'API request completed');
    } catch (error) {
      setResult(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSuccessfulApiRequest = async () => {
    setLoading(true);
    try {
      const response = await sentryFetch('/api/sentry-test', {
        method: 'GET',
      });
      
      const data = await response.json();
      setResult(data.message || 'Successful API request');
    } catch (error) {
      setResult(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Sentry Integration Test
      </h3>
      
      <div className="space-y-2">
        <button
          onClick={testFrontendError}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Test Frontend Error Capture
        </button>
        
        <button
          onClick={testApiRequest}
          disabled={loading}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Error Capture'}
        </button>
        
        <button
          onClick={testSuccessfulApiRequest}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Successful API Request'}
        </button>
      </div>
      
      {result && (
        <div className="p-3 bg-blue-100 border border-blue-300 rounded text-blue-800">
          <strong>Result:</strong> {result}
        </div>
      )}
      
      <div className="text-sm text-gray-600">
        <p>
          These buttons test different aspects of the Sentry integration:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Frontend error capture and reporting</li>
          <li>API error monitoring and capture</li>
          <li>Successful API request tracking</li>
        </ul>
        <p className="mt-2">
          Check your Sentry dashboard to see the captured events and performance data.
        </p>
      </div>
    </div>
  );
} 