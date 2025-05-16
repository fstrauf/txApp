"use client";

import Link from "next/link";
import AppBetaPopup from "@/components/shared/AppBetaPopup";
import { useSession } from 'next-auth/react';

export default function HomePageClientContent() {
  const { data: session, status: sessionStatus } = useSession();

  return (
    <>
      <AppBetaPopup />
      {/* CTAs and session-dependent text */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center mb-4">
        {/* Conditional CTA Button/Link */}
        {sessionStatus === 'loading' && (
          <button
            disabled
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed text-lg w-full sm:w-auto"
          >
            Loading...
          </button>
        )}
        {sessionStatus === 'unauthenticated' && (
          <Link
            href="/auth/signup?callbackUrl=/integrations"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg w-full sm:w-auto"
          >
            Start Free Trial
          </Link>
        )}
        {sessionStatus === 'authenticated' && (
          <Link
            href="/integrations" // Link directly to integrations if logged in
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg w-full sm:w-auto"
          >
            Get Started
          </Link>
        )}
      </div>
      {/* Hide trial text if authenticated or loading */}
      {sessionStatus === 'unauthenticated' && (
         <p className="text-xs text-gray-500 text-center md:text-left">
            Free trial. No credit card required.
        </p>
      )}
    </>
  );
} 