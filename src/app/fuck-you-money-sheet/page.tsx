import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import GetItHereButton from "./getItHereButton";
import Instructions from "./instructions";
import Intro from "./intro";
import StayUpToDate from "./stayUpToDate";
import PageHeader from "../../components/PageHeader";
import AddOnButton from "../components/buttons/AddOnButton";

export const metadata: Metadata = {
  title: "Financial Freedom Calculator - F*ck You Money Tracker | Expense Sorted",
  description: "Calculate your path to financial independence with our F*ck You Money calculator. Track your cost of living, build emergency funds, and plan your journey to financial freedom.",
  alternates: {
    canonical: "/fuck-you-money-sheet",
  },
  openGraph: {
    title: "Financial Freedom Calculator - F*ck You Money Tracker | Expense Sorted",
    description: "Calculate your path to financial independence with our F*ck You Money calculator. Track your cost of living, build emergency funds, and plan your journey to financial freedom.",
    url: "/fuck-you-money-sheet",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 951,
        height: 635,
        alt: "Financial Freedom Calculator - F*ck You Money Tracker",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Freedom Calculator - F*ck You Money Tracker",
    description: "Calculate your path to financial independence and track your journey to financial freedom.",
    images: ["/opengraph-image.png"],
  },
};

export default function FinancialFreedomSheet() {
  return (
    <div className="min-h-screen bg-background-default overflow-x-hidden">
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
        <div className="bg-surface rounded-2xl shadow-soft p-4 md:p-8 space-y-6 md:space-y-8 max-w-full overflow-x-hidden">
          <PageHeader title="Financial Freedom - Cost of Living Tracking" />

          {/* Combined Promotional Section */}
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 rounded-2xl p-6 md:p-8 border border-primary/20 mb-8 shadow-lg">
            {/* Header with Icon */}
            <div className="flex items-center mb-6">
              <div className="bg-white p-3 rounded-full shadow-md mr-4 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Supercharge Your Spreadsheet Finances</h2>
                <p className="text-gray-700 mt-1">Transform your monthly financial routine with our AI-powered workflow</p>
              </div>
            </div>

            {/* Two-column layout for larger screens */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Left column - Value proposition */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Changes Everything</h3>
                <p className="text-gray-700 mb-4">
                  Our simple workflow helps you get your finances under control in just a few minutes each month. 
                  No more manual categorization, no more spreadsheet headaches.
                </p>
                <div className="bg-white/50 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Save 2+ hours per month</span>
                  </div>
                </div>
              </div>

              {/* Right column - Workflow steps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your New Monthly Routine</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span className="text-sm text-gray-700">Download your latest bank statement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span className="text-sm text-gray-700">
                      Go to <Link href="/personal-finance" className="text-primary hover:text-primary-dark font-medium underline decoration-primary/30 hover:decoration-primary">My Finance Overview</Link> and upload your statement
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span className="text-sm text-gray-700">Review AI-categorized transactions and import to your spreadsheet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span>
                    <span className="text-sm text-gray-700">Get instant insights on spending patterns and financial runway</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Call-to-action footer */}
            <div className="mt-6 pt-6 border-t border-primary/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Ready to transform your finances?</span> 
                    Start with the spreadsheet below, then supercharge it with our tool.
                  </p>
                </div>
                <Link 
                  href="/personal-finance" 
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  Try It Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <GetItHereButton />

            {/* Featured Testimonial - Added for social proof */}
            <div className="my-6 md:my-8 bg-white p-4 md:p-6 rounded-xl shadow-soft border border-gray-100">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 mr-3 md:mr-4 overflow-hidden">
                  <Image
                    src="/testimonial-featured.jpg"
                    width={48}
                    height={48}
                    alt="Jessie T."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">Jessie T.</p>
                  <p className="text-xs md:text-sm text-gray-600">Software Engineer</p>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-700 italic">
                "This spreadsheet changed my relationship with money. I finally know exactly how long my savings will
                last, which gave me the confidence to negotiate a better salary at work. Worth every penny!"
              </p>
              <div className="flex mt-2">
                <span className="text-yellow-400">★★★★★</span>
              </div>
            </div>

            <StayUpToDate />
            <div className="mt-8 md:mt-12 rounded-xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300">
              <ImageComponent />
            </div>
            <div className="mt-6 md:mt-8">
              <Navigation />
            </div>
            <div className="prose prose-lg max-w-none mt-12 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark">
              <Intro />
              <Instructions />
            </div>
            
            {/* Final Add-on Cross-Promotion */}
            <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-center mb-4">Just want to categorize your transactions?</h3>
              <div className="flex flex-col items-center">
                <p className="text-center text-gray-700 max-w-2xl mb-6">
                  Level up any spreadsheet with our AI-powered transaction categorisation add-on.
                </p>
                <AddOnButton 
                  size="lg" 
                  variant="primary" 
                  text="Install the AI Add-on" 
                  className="shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ImageComponent() {
  return (
    <Image
      width={1306}
      height={1230}
      src="/f-you-money-expense-vs-savings.png"
      className="w-full h-auto max-w-full"
      alt="Financial Freedom Spreadsheet"
      priority={true}
    />
  );
}

function Navigation() {
  return (
    <nav className="flex flex-wrap gap-4 justify-center">
      <Link
        href="#intro"
        className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow"
      >
        Intro
      </Link>
      <Link
        href="#instructions"
        className="px-6 py-3 rounded-xl bg-white text-primary border border-primary/10 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-soft"
      >
        Instructions
      </Link>
      <AddOnButton 
        size="lg" 
        variant="secondary" 
        text="Get Add-on" 
        className="rounded-xl font-semibold shadow-soft"
      />
    </nav>
  );
}
