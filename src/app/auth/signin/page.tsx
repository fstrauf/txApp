'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { authApi } from '../../../lib/api-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Check for error from URL params
  useState(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(`Login error: ${errorParam}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('');

    try {
      // Login with NextAuth directly
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        setDebugInfo(JSON.stringify(result, null, 2));
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError('An error occurred during sign in');
      setDebugInfo(err instanceof Error ? err.message : JSON.stringify(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="name@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      
      <div className="mt-4 flex justify-center">
        <Link
          href="/auth/forgot-password"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Forgot your password?
        </Link>
      </div>
      
      <div className="mt-6 flex items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="px-4 text-sm text-gray-500">Or continue with</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">
          Sign up
        </Link>
      </p>

      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mt-6 p-3 bg-gray-100 text-xs overflow-auto">
          <h3 className="font-medium mb-1">Debug Info:</h3>
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  );
} 