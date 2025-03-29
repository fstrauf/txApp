'use client';

import { useState, useEffect } from 'react';
import { authApi } from '../../lib/api-client';

export default function TestApiPage() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Test the API connection
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`)
      .then(response => response.json())
      .then(data => {
        setApiStatus('connected');
        setMessage(data.message || 'API Connected');
      })
      .catch(error => {
        console.error('API connection error:', error);
        setApiStatus('error');
        setMessage('Failed to connect to API');
      });
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult('Sending forgot password request...');
    
    try {
      const result = await authApi.forgotPassword(email);
      setTestResult(`Success! Check console for reset link. Response: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Forgot password error:', error);
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult('Sending reset password request...');
    
    try {
      const result = await authApi.resetPassword(resetToken, newPassword);
      setTestResult(`Password reset successful! Response: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Reset password error:', error);
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <div className={`p-4 mb-6 rounded ${
        apiStatus === 'connected' ? 'bg-green-100 border border-green-400' : 
        apiStatus === 'error' ? 'bg-red-100 border border-red-400' :
        'bg-yellow-100 border border-yellow-400'
      }`}>
        <p className="font-medium">
          {apiStatus === 'connected' ? '✅ ' : apiStatus === 'error' ? '❌ ' : '⏳ '}
          {message || 'Checking API connection...'}
        </p>
        <p className="text-sm mt-1 text-gray-600">
          API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forgot Password Test */}
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Test Forgot Password</h2>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={apiStatus !== 'connected'}
            >
              Send Reset Link
            </button>
          </form>
        </div>

        {/* Reset Password Test */}
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Test Reset Password</h2>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={apiStatus !== 'connected'}
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>

      {testResult && (
        <div className="mt-6 p-4 bg-gray-100 rounded border">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p className="whitespace-pre-wrap">{testResult}</p>
        </div>
      )}
    </div>
  );
} 