"use client";
import Image from "next/image";
import References from "./components/References.js";
import FAQ from "./components/FAQ.js";
import Link from "next/link";
import AppBetaPopup from "@/components/shared/AppBetaPopup";
import PremiumWaitlistDialog from "@/components/shared/PremiumWaitlistDialog";
import { useState } from 'react';
import { Box } from "@/components/ui/Box";

export default function HomePageClient() {
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-default">
      <AppBetaPopup />

      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        {/* New Hero Section - Personal Finance Health Check */}
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-16 md:mb-24">
          {/* Left Column: New Value Prop */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">New: Personal Finance Health Check</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Get Your Finances Sorted in{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">3 Minutes</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Answer a few questions and discover exactly where your money goes, how you compare to others, and get a personalized plan to save
              <span className="font-semibold"> $3,000+</span> this year.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">$297</div>
                <div className="text-sm text-gray-600">Avg. monthly savings</div>
              </div>
              <div className="border-l border-gray-300 h-12"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">3 min</div>
                <div className="text-sm text-gray-600">To complete</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/personal-finance"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg text-lg"
              >
                Get Your Finances Under Control
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center md:text-left">
              No signup required. 100% free. Your data stays private.
            </p>
          </div>

          <div className="w-full md:w-1/2">
            <div className="mb-4">
              <Image
                src="/expense-sorted_tx_analysis.png"
                alt="Personal Finance Dashboard showing expense categorization and savings opportunities"
                width={1663}
                height={1618}
                className="w-full h-auto rounded-xl shadow-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100">
              <p className="text-sm text-gray-700 font-medium text-center">
                Join 10,000+ users taking control of their finances
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Value Proposition Section */}
        <Box 
          variant="bordered" 
          padding="lg" 
          className="mb-16 border-2 border-primary/20"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 mb-6">
              <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
              <span className="text-sm font-medium text-secondary">Already Budgeting? Perfect!</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Supercharge Your Existing Setup
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              You're already on the right track! Now let our AI handle the tedious categorization while you focus on making smart financial decisions.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep Your Spreadsheet</h3>
                <p className="text-gray-600 text-sm">Continue using Google Sheets, Excel, or any budgeting app you love.</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add AI Power</h3>
                <p className="text-gray-600 text-sm">Let our AI automatically categorize transactions and find saving opportunities.</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Save More Money</h3>
                <p className="text-gray-600 text-sm">Get personalized insights and action plans to optimize your spending.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Already using other tools?</span> No problem! Our API works with any budgeting app.
              </p>
            </div>
          </div>
        </Box>

        {/* The Journey Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            Your Path to Financial Freedom
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Step 1: Get Your Financial Snapshot (Free) */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center relative h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-indigo-600">1</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Get Your Snapshot</h3>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    100% Free
                  </span>
                </div>
              </div>
              
              <div className="text-center flex-1 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    Discover where your money really goes and how you compare to others in just 3 minutes.
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">AI Categorization</div>
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="text-sm font-medium text-primary">Processing...</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </Box>

            {/* Step 2: Get Smart Insights */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center relative h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Get Smart Insights</h3>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Premium Feature
                  </span>
                </div>
              </div>
              
              <div className="text-center flex-1 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    Auto-sync your bank accounts and get weekly insights delivered right to your inbox.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3 text-xs">
                    <div className="bg-white/80 px-2 py-1 rounded">
                      <span className="text-gray-600">Weekly reports</span>
                    </div>
                    <div className="bg-white/80 px-2 py-1 rounded">
                      <span className="text-gray-600">Trend analysis</span>
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium">
                  Coming Soon
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* AI Financial Coaching Box */}
              
              <button
                onClick={() => setIsWaitlistDialogOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                Join Waitlist →
              </button>
              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </Box>

            {/* Step 3: Achieve Your Goals */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-green-600">3</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Achieve Your Goals</h3>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Your Success
                  </span>
                </div>
              </div>
              
              <div className="text-center flex-1">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Watch your savings grow and reach financial milestones faster than ever.
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Emergency fund built
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Debt paid down faster
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Investment goals achieved
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          </div>

          {/* Call to Action Highlight - moved outside the grid */}
          <div className="max-w-lg mx-auto mt-10 md:mt-12 text-center py-4">
            <div className="inline-block bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 font-semibold px-6 py-2 rounded-full text-sm mb-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Start your journey today
              </span>
            </div>
          </div>
        </Box>

        {/* Tools Section */}
        <Box variant="gradient" padding="lg" className="mb-16" id="tools">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Choose Your Perfect Tool
            </h2>
            <p className="text-lg text-black/90 max-w-2xl mx-auto">
              Whether you're just starting or already have a system, we have the right solution for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Financial Health Check */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/95 backdrop-blur-sm">
              <div className="mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Health Check</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Perfect for beginners. Get instant insights about your spending and personalized recommendations.
                </p>
                <div className="space-y-2 text-left text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    3-minute assessment
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Spending analysis
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Personalized action plan
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    No signup required
                  </div>
                </div>
              </div>
              <Link
                href="/personal-finance"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md group-hover:shadow-lg"
              >
                Start Health Check
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </Box>

            {/* Google Sheets Integration */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/95 backdrop-blur-sm">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image
                    src="/Google_Sheets_2020_Logo.png"
                    alt="Google Sheets"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Google Sheets Add-on</h3>
                <p className="text-gray-600 text-sm mb-4">
                  For spreadsheet lovers. Automatically categorize transactions right in your Google Sheets.
                </p>
                <div className="space-y-2 text-left text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Works with existing sheets
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    AI-powered categorization
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Bulk processing
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Free tier available
                  </div>
                </div>
              </div>
              <Link
                href="/integrations"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-200 shadow-md group-hover:shadow-lg"
              >
                Get Add-on
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </Box>

            {/* API Integration */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/95 backdrop-blur-sm">
              <div className="mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Developer API</h3>
                <p className="text-gray-600 text-sm mb-4">
                  For developers and advanced users. Integrate our AI categorization into any app or workflow.
                </p>
                <div className="space-y-2 text-left text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    RESTful API
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Real-time processing
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Custom integrations
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Scalable pricing
                  </div>
                </div>
              </div>
              <Link
                href="/api-landing"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md group-hover:shadow-lg"
              >
                View API Docs
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </Box>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-white/90 mb-6 text-lg">
              Not sure which tool is right for you?
            </p>
            <Link
              href="/personal-finance"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-primary font-semibold hover:shadow-xl transition-all duration-200 text-lg"
            >
              Start with the Free Financial Check
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </Box>

        {/* Premium Features Preview */}
        <Box variant="bordered" padding="lg" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coming Soon: Premium Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're building advanced features to take your financial management to the next level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Auto Bank Sync */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Bank Sync</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your bank accounts for automatic transaction import and real-time categorization.
                </p>
                <div className="space-y-1 text-left text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2">•</span>
                    Secure bank connections
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2">•</span>
                    Real-time sync
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2">•</span>
                    Multiple accounts
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsWaitlistDialogOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                Join Waitlist →
              </button>
            </Box>

            {/* Weekly Insights */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Insights & Coaching</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get personalized weekly reports and AI-powered financial coaching delivered to your inbox.
                </p>
                <div className="space-y-1 text-left text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-2">•</span>
                    Weekly email reports
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-2">•</span>
                    Spending trend analysis
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 mr-2">•</span>
                    Goal tracking & tips
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsWaitlistDialogOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                Join Waitlist →
              </button>
            </Box>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Join our waitlist</span> and be the first to know when premium features launch
            </p>
            <button
              onClick={() => setIsWaitlistDialogOpen(true)}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              Join Premium Waitlist
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Box>

        {/* Social Proof Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real Results from Real People
            </h2>
            <p className="text-lg text-gray-600">
              See how others are taking control of their finances with Expense Sorted
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Emergency Fund Success */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "I discovered I was spending $400/month on subscriptions I forgot about! Expense Sorted helped me build a $5,000 emergency fund in just 6 months."
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                <Image
                  src="/testimonial-alex.jpg"
                    width={40}
                    height={40}
                  alt="Alex M."
                  className="w-full h-full object-cover"
                />
                </div>
                <div>
                  <p className="font-semibold">Alex M.</p>
                  <p className="text-xs text-gray-500">Software Engineer → Built $5K Emergency Fund</p>
                </div>
              </div>
            </Box>
            
            {/* Time Freedom Testimonial */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "Before Expense Sorted, I spent hours every month categorizing transactions. Now it's automated and I actually understand where my money goes!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <Image
                    src="/testimonial-sarah.jpg"
                    width={40}
                    height={40}
                    alt="Sarah L."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">Sarah L.</p>
                  <p className="text-xs text-gray-500">Small Business Owner → Saves 5+ Hours/Month</p>
                </div>
              </div>
            </Box>
            
            {/* Debt Freedom Success */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "The insights from my spending analysis showed me exactly where to cut back. I paid off $15,000 in credit card debt 2 years ahead of schedule!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  <Image
                    src="/testimonial-mike.jpg"
                    width={40}
                    height={40}
                    alt="Mike R."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">Mike R.</p>
                  <p className="text-xs text-gray-500">Teacher → Debt Free 2 Years Early</p>
                </div>
              </div>
            </Box>
          </div>
        </Box>

        {/* F*** You Money Calculator CTA */}
        <Box variant="gradient" padding="lg" className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Calculate Your "F*** You Money"
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              How much money do you need to have total financial freedom? Use our calculator to find out your exact number and create a plan to get there.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">25x</div>
                <div className="text-sm text-white/80">Annual Expenses Rule</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">4%</div>
                <div className="text-sm text-white/80">Safe Withdrawal Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">Free</div>
                <div className="text-sm text-white/80">No Signup Required</div>
              </div>
            </div>

            <Link
              href="/fuck-you-money-sheet"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft"
            >
              Get Started Now
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* References Section */}
        <Box variant="gradient" padding="lg">
          <References />
        </Box>
      </main>

      {/* Premium Waitlist Dialog */}
      <PremiumWaitlistDialog 
        isOpen={isWaitlistDialogOpen} 
        onClose={() => setIsWaitlistDialogOpen(false)} 
      />
    </div>
  );
}
