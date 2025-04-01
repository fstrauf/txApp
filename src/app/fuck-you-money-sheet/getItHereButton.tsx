"use client";
import { useState } from "react";
// Use next-auth/react for session management
import { useSession } from "next-auth/react";

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
        body: JSON.stringify({ email: emailToSend }),
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

  // If user is logged in, show the links directly
  if (user) {
    return (
      <div className="text-center mt-8">
        {/* Show success message and links directly for logged-in users */}
        <div className="space-y-4">
          <p className="text-green-600 mb-4">Welcome back! Here's your spreadsheet:</p>
          <a
            className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
            href="https://docs.google.com/spreadsheets/d/1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4/edit?gid=432578983#gid=432578983"
            target="_blank"
            rel="noopener noreferrer"
          >
            Access Spreadsheet
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <div className="mt-4">
            <a
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-primary border border-primary/10 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-soft"
              href="/api-key"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get API Key
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, proceed with the email collection flow
  return (
    <div className="text-center mt-8">
      {/* 1. Submitted State: Show success and links (after anonymous submission) */}
      {submitted && (
        <div className="space-y-4">
          <p className="text-green-600 mb-4">Thanks! Here's your spreadsheet:</p>
          <a
            className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
            href="https://docs.google.com/spreadsheets/d/1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4/edit?gid=432578983#gid=432578983"
            target="_blank"
            rel="noopener noreferrer"
          >
            Access Spreadsheet
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <div className="mt-4">
            <a
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-primary border border-primary/10 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-soft"
              href="/api-key"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get API Key
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
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

      {/* 3. Email Form State: Show if button was clicked (only for anonymous users) */}
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
            >
              Submit & Get Spreadsheet
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      )}

      {/* 4. Initial Button State: Show only if anonymous, not submitted, not loading, and button not clicked */}
      {!submitted && !isLoading && !showEmailInput && (
        <button
          onClick={handleGetSpreadsheet}
          className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
        >
          Get the Spreadsheet
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
