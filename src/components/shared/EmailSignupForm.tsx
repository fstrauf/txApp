"use client";

import { useEmailSignup } from "@/hooks/useEmailSignup";

interface EmailSignupFormProps {
  source: string;
  tags: string[];
  title: string;
  description: string;
  successMessage?: string;
  onSuccess?: () => void;
  className?: string;
  buttonText?: string;
  placeholder?: string;
}

export default function EmailSignupForm({
  source,
  tags,
  title,
  description,
  successMessage = "Thanks! We'll keep you updated.",
  onSuccess,
  className = "",
  buttonText = "Subscribe",
  placeholder = "your.email@example.com"
}: EmailSignupFormProps) {
  const { state, actions, userEmail } = useEmailSignup({
    source,
    tags,
    onSuccess
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await actions.submitEmail();
  };

  if (state.success) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 font-medium">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Only show email input if user is not logged in */}
        {!userEmail && (
          <div>
            <input
              type="email"
              value={state.email}
              onChange={(e) => actions.setEmail(e.target.value)}
              placeholder={placeholder}
              required
              disabled={state.isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm disabled:opacity-50"
            />
          </div>
        )}

        {/* Show current user's email if logged in */}
        {userEmail && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              We'll notify you at: <span className="font-medium">{userEmail}</span>
            </p>
          </div>
        )}

        {state.error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={state.isLoading}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all duration-200"
        >
          {state.isLoading ? 'Submitting...' : buttonText}
        </button>
      </form>
    </div>
  );
}
