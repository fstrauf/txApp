'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('Password123!');
  const [message, setMessage] = useState('');

  // Create a test user directly
  const createTestUser = async () => {
    try {
      setMessage('Creating or updating test user...');
      
      // Using the test-db API we created earlier
      const response = await fetch('/api/test-db?create=true&email=' + encodeURIComponent(testEmail) + '&password=' + encodeURIComponent(testPassword));
      const data = await response.json();
      
      if (data.success) {
        setMessage(`Success! Test user created/updated: ${testEmail}`);
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Session Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          
          <div className={`mb-4 p-3 rounded ${status === 'authenticated' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <p className="font-medium">
              Status: {status === 'authenticated' ? '✅ Authenticated' : '❌ Not authenticated'}
            </p>
          </div>
          
          {session ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Current User:</h3>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Name: {session.user?.name || 'Not set'}</li>
                <li>Email: {session.user?.email}</li>
                <li>ID: {session.user?.id}</li>
              </ul>
              
              <div className="mt-4">
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="mb-4">Not signed in</p>
              <button
                onClick={() => signIn()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
        
        {/* Test User Creation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Test User</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="text"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            <button
              onClick={createTestUser}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create/Update Test User
            </button>
            
            {message && (
              <div className={`mt-4 p-3 rounded ${message.includes('Success') ? 'bg-green-100' : 'bg-red-100'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/auth/signin" className="block p-4 bg-white rounded shadow text-center hover:bg-gray-50">
          Sign In Page
        </Link>
        <Link href="/auth/signup" className="block p-4 bg-white rounded shadow text-center hover:bg-gray-50">
          Sign Up Page
        </Link>
        <Link href="/auth/forgot-password" className="block p-4 bg-white rounded shadow text-center hover:bg-gray-50">
          Forgot Password Page
        </Link>
      </div>
    </div>
  );
} 