"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Something went wrong");
      }

      // Registration successful, now sign in
      console.log(`[RegisterForm] Registration OK. Attempting sign in with callbackUrl: ${callbackUrl}`);
      const signInResponse = await signIn("credentials", {
        email, 
        password,
        callbackUrl: callbackUrl, // PASS the callbackUrl here
      });

      // ONLY check for explicit error from signIn.
      // If no error, the server-side redirect callback is handling navigation.
      if (signInResponse?.error) {
        // If signIn itself fails (e.g., network error, server issue during callback)
        console.error("[RegisterForm] Sign-in after registration failed:", signInResponse.error);
        setError(
          `Account created, but automatic sign-in failed: ${signInResponse.error}. Please try logging in manually.` // Provide more context
        );
        // Optional: Redirect to login page on sign-in failure?
        // router.push(`/auth/signin?error=${signInResponse.error}`);
      } 
      // No need to check .ok or have a final else block, 
      // as success is indicated by the server-side redirect taking effect.
      
    } catch (error) {
      // This catch block is primarily for the registration fetch
      console.error("[RegisterForm] Registration or Sign-in Error:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      // Only stop loading indicator. Let redirect handle navigation.
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-base font-medium leading-none text-gray-900"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="John Doe"
        />
      </div>
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
          autoComplete="new-password"
          required
          className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Create a password"
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
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
} 