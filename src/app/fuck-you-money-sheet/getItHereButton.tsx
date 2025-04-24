"use client";
import { useState } from "react";
// Use next-auth/react for session management
import { useSession } from "next-auth/react";
// import { Button } from "@/components/ui/button"; // Remove old import
import { Button } from '@headlessui/react'; // Import Headless UI Button
import Link from 'next/link'; // Ensure Link is imported if needed for asChild replacement

export default function GetItHereButton() {
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Use useSession hook from next-auth
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoadingSession = status === "loading";

  // Common button classes
  const buttonClasses = "inline-flex items-center justify-center rounded-md px-6 py-3 text-lg font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";
  const primaryButtonClasses = `${buttonClasses} bg-primary hover:bg-primary-dark data-[hover]:bg-primary-dark data-[disabled]:bg-gray-400`;

  const handleGetSpreadsheet = () => {
    setShowEmailInput(true);
  };

  const handleEmailSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Use user's email from session if available and email state is empty
    const emailToSend = email || user?.email;
    if (!emailToSend) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/createEmailContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailToSend,
          source: "SPREADSHEET",
          tags: ["spreadsheet-user"]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state while session is being checked
  if (isLoadingSession) {
    return (
      <div className="text-center mt-8">
        <div className="flex justify-center items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show the links directly using Button component
  if (user) {
    return (
      <div className="text-center mt-8">
        <div className="space-y-4">
          <p className="text-green-600 mb-4">Welcome back! Here's your spreadsheet:</p>
          {/* Replaced Button asChild with styled Link */}
          <Link
              href="https://docs.google.com/spreadsheets/d/1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4/edit?gid=432578983#gid=432578983"
              target="_blank"
              rel="noopener noreferrer"
            className={primaryButtonClasses} // Apply button styles
            >
              Access Spreadsheet
          </Link>
          <div className="mt-4">
            {/* Replaced Button asChild with styled Link */}
            <Link
                href="/api-key"
                rel="noopener noreferrer"
              className={primaryButtonClasses} // Apply button styles
              >
                Get API Key
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, proceed with the email collection flow
  return (
    <div className="text-center mt-8">
      {/* 1. Submitted State: Show success and links using Button component */}
      {submitted && (
        <div className="space-y-4">
          <p className="text-green-600 mb-4">Thanks! Here's your spreadsheet:</p>
          {/* Replaced Button asChild with styled Link */}
          <Link
              href="https://docs.google.com/spreadsheets/d/1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4/edit?gid=432578983#gid=432578983"
              target="_blank"
              rel="noopener noreferrer"
            className={primaryButtonClasses} // Apply button styles
            >
              Access Spreadsheet
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
          </Link>
          <div className="mt-4">
            {/* Replaced Button asChild with styled Link */}
            <Link
                href="/api-key"
                rel="noopener noreferrer"
              className={primaryButtonClasses} // Apply button styles
              >
                Get API Key
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Loading State (API Call) */}
      {isLoading && (
        <div className="flex justify-center items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p>Processing...</p>
        </div>
      )}

      {/* 3. Email Form State: Use Button component for submit */}
      {!submitted && !isLoading && showEmailInput && (
        <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-sm mx-auto">
           <div className="flex flex-col items-center space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full disabled:opacity-50"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className={`${primaryButtonClasses} w-full`} // Apply base styles + full width
            >
              Submit & Get Spreadsheet
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </form>
      )}

      {/* 4. Initial Button State: Use Button component */}
      {!submitted && !isLoading && !showEmailInput && (
        <Button
          onClick={handleGetSpreadsheet}
          className={primaryButtonClasses} // Apply base styles
        >
          Get the Spreadsheet
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}
    </div>
  );
}
