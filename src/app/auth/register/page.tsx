import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "../signin/google-button";

export const metadata: Metadata = {
  title: "Sign Up | ExpenseSorted",
  description: "Create a new ExpenseSorted account",
};

export default async function SignUpPage() {
  const session = await getServerSession(authConfig);
  
  // If user is already signed in, redirect to main site
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-md sm:rounded-lg sm:px-10">
          <RegisterForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 