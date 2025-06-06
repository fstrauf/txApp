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

          {/* Add-on Cross-Promotion Banner */}
          <div className="max-w-3xl mx-auto bg-linear-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 mb-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-full shadow-sm mr-4 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="max-w-full sm:max-w-md">
                  <h3 className="font-semibold text-gray-900">Supercharge Your Spreadsheet</h3>
                  <p className="text-sm text-gray-700">Automatically categorize transactions in seconds with our Google Sheets Add-on</p>
                </div>
              </div>
              <AddOnButton size="md" variant="primary" text="Install Add-on" className="whitespace-nowrap shrink-0 w-full sm:w-auto" />
            </div>
          </div>

          {/* Key Benefits Summary - Added for immediate value clarity */}
          <div className="max-w-3xl mx-auto bg-primary/5 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">What You'll Get:</h2>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">✓</span>
                <span>Track all your expenses automatically with smart categorization</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">✓</span>
                <span>Calculate your financial runway - exactly how long your savings will last</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">✓</span>
                <span>Visualize your progress toward financial independence</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">✓</span>
                <span>One-time setup, lifetime value - no ongoing subscription fees</span>
              </li>
            </ul>
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
              <h3 className="text-xl font-bold text-center mb-4">Ready to save hours every month?</h3>
              <div className="flex flex-col items-center">
                <p className="text-center text-gray-700 max-w-2xl mb-6">
                  This spreadsheet works great on its own, but with our AI-powered add-on, you can automatically categorize all your transactions in seconds instead of spending hours doing it manually.
                </p>
                <AddOnButton 
                  size="lg" 
                  variant="primary" 
                  text="Install the AI Add-on" 
                  className="shadow-md"
                />
                <p className="mt-3 text-xs text-gray-500">One-time purchase, no subscription required</p>
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
