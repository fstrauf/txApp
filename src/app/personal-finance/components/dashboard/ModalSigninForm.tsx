import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

interface ModalSigninFormProps {
  onSigninSuccess: () => void;
}

export const ModalSigninForm: React.FC<ModalSigninFormProps> = ({ onSigninSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const signInResponse = await signIn("credentials", {
        email, 
        password,
        redirect: false, // Don't redirect, handle success in callback
      });

      if (signInResponse?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (signInResponse?.ok) {
        // Sign-in successful, trigger the callback
        onSigninSuccess();
      }
      
    } catch (error) {
      console.error("Sign-in Error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="signin-password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}; 