import { SignInForm } from "@/components/auth/sign-in-form";
import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "./google-button";

export const metadata: Metadata = {
  title: "Sign In | ExpenseSorted",
  description: "Sign in to your ExpenseSorted account",
};

interface SignInPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  // Check if user is already signed in
  const session = await getServerSession(authConfig);
  
  // Extract callback URL from search params
  const callbackUrl = searchParams?.callbackUrl as string;
  
  // If user is already signed in, redirect to callback URL or main site
  if (session?.user) {
    redirect(callbackUrl || "/");
  }

  // Construct signup URL with callback URL preserved
  const signupUrl = callbackUrl 
    ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/auth/signup';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-base text-gray-600">
          Or{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors inline-block min-h-[44px] text-base"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-md sm:rounded-lg sm:px-10">
          <SignInForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-base">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 text-base py-2 px-4 rounded-md hover:bg-blue-50 transition-colors inline-block min-h-[44px] flex items-center justify-center"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 