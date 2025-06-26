"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Remove props interface if no props are needed
interface SignInFormProps {}

// Remove props from signature
export function SignInForm({}: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract callbackUrl using the hook's result
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null); 

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        // redirect: false, // REMOVE: Let NextAuth handle redirect based on server callback
      });

      // If redirect is handled by NextAuth, this error check might run
      // AFTER the redirect has started. We might only see errors if the 
      // redirect itself fails or if there's an immediate auth error.
      if (result?.error) {
        console.error("[SignInForm] signIn error:", result.error);
        // Don't manually redirect here
        setError("Invalid email or password");
      } else if (!result?.ok) {
         // Don't manually redirect here
        setError("Sign in failed. Please try again.");
      } else {
        // Sign in successful, redirect is handled by NextAuth server-side
        // No need for client-side router.push
        console.log("[SignInForm] Sign in successful, NextAuth will handle redirect.");
      }
    } catch (error) {
      console.error("[SignInForm] onSubmit error:", error);
      setError("Something went wrong. Please try again.");
      // No manual redirect on error either
    } finally {
      setIsLoading(false);
      // REMOVE Manual redirect logic
      // if (signInSuccess) {
      //   router.push(callbackUrl); 
      // }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-base font-medium leading-none text-gray-900"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-base font-medium leading-none text-gray-900"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter your password"
        />
      </div>
      {error && (
        <div className="text-base text-red-500">
          {error}
        </div>
      )}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 px-4 rounded-md text-base font-medium min-h-[48px]"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
} 