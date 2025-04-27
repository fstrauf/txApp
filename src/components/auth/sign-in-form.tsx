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

    let signInSuccess = false; // Flag to track success for manual redirect

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Prevent automatic redirect
      });

      if (result?.error) {
        console.error("[SignInForm] signIn error:", result.error);
        setError("Invalid email or password");
        signInSuccess = false;
      } else if (!result?.ok) {
        setError("Sign in failed. Please try again.");
        signInSuccess = false;
      } else {
        // Sign in was successful according to next-auth
        signInSuccess = true;
      }
    } catch (error) {
      console.error("[SignInForm] onSubmit error:", error);
      setError("Something went wrong. Please try again.");
      signInSuccess = false;
    } finally {
      setIsLoading(false);
      // Manual redirect only if signIn was successful
      if (signInSuccess) {
        router.push(callbackUrl); 
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none text-gray-900"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium leading-none text-gray-900"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter your password"
        />
      </div>
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-md"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
} 