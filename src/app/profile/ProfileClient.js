"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState, useEffect } from 'react';
import { SubscriptionCancellation } from '@/components/profile/SubscriptionCancellation';
import { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

// Use a data URL for the default avatar to avoid domain configuration issues
const defaultPicture = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

export default function ProfileClient({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser?.subscription);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.subscription) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch profile data');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error fetching profile:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.subscription]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const refreshProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to refresh profile data');
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading profile...</div>;
  }

  const subscription = user.subscription;
  const isSubscribed = subscription && (
    subscription.status === 'ACTIVE' || 
    subscription.status === 'TRIALING' || 
    subscription.status === 'PAST_DUE'
  );
  const isCancellationPending = subscription?.cancelAtPeriodEnd === true;

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg text-gray-900">
          <h1 className="text-2xl font-semibold mb-4 text-gray-800">Profile</h1>
          <div className="flex items-center mb-6">
            <Image
              src={user.image || defaultPicture}
              alt="Profile"
              className="w-20 h-20 rounded-full mr-4"
              width={80}
              height={80}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user.name || 'User'}</h2>
              <span className="text-gray-600">{user.email}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Subscription</h3>
            {isLoading && <p>Loading subscription details...</p>}
            {error && <p className="text-red-500">Error loading details: {error}</p>}
            {!isLoading && !error && (
              <>
                {isSubscribed ? (
                  <div>
                    <p>Status: <span className={`font-medium ${subscription.status === 'ACTIVE' || subscription.status === 'TRIALING' ? 'text-green-600' : 'text-yellow-600'}`}>{subscription.status}</span></p>
                    <p>Plan: {subscription.plan} ({subscription.billingCycle})</p>
                    {subscription.status === 'TRIALING' && subscription.trialEndsAt && <p>Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}</p>}
                    {subscription.currentPeriodEnd && !isCancellationPending && <p>Renews on: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>}
                    
                    <SubscriptionCancellation 
                      isCancellationPending={isCancellationPending}
                      currentPeriodEnd={subscription.currentPeriodEnd}
                      onSubscriptionCancelled={refreshProfileData}
                    />
                  </div>
                ) : (
                  <p>You do not have an active subscription.</p>
                )}
              </>
            )}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Account Actions</h3>
            <Button 
              asChild
              variant="primary"
              className="mt-2 mr-2"
            >
              <a href="/api-key">
                Manage API Key
              </a>
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="mt-2"
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
