'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('An authentication error occurred');
  
  useEffect(() => {
    // Get error from URL parameters
    const error = searchParams.get('error');
    
    if (error) {
      switch (error) {
        case 'OAuthSignin':
          setErrorMessage('Error starting the sign in process.');
          break;
        case 'OAuthCallback':
          setErrorMessage('Error during the sign in process.');
          break;
        case 'OAuthCreateAccount':
          setErrorMessage('Could not create an account.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Could not create an account using email.');
          break;
        case 'Callback':
          setErrorMessage('Error during the sign in callback.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorMessage('This email is already associated with a different sign in method.');
          break;
        case 'EmailSignin':
          setErrorMessage('Error sending the sign in email.');
          break;
        case 'CredentialsSignin':
          setErrorMessage('Invalid credentials. Please check your email and password.');
          break;
        case 'SessionRequired':
          setErrorMessage('You must be signed in to access this page.');
          break;
        default:
          setErrorMessage(`Authentication error: ${error}`);
      }
    }
  }, [searchParams]);
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Authentication Error</h1>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-700">{errorMessage}</p>
      </div>
      
      <p className="mb-6 text-gray-600">
        Please try again or contact support if the problem persists.
      </p>
      
      <div className="flex justify-between">
        <Link
          href="/auth/signin"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Sign In
        </Link>
        
        <Link
          href="/"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
} 