"use client";
import Image from "next/image";
import References from "./components/References.js";
import FAQ from "./components/FAQ.js";
import Link from "next/link";
import AppBetaPopup from "@/components/shared/AppBetaPopup";
import PremiumWaitlistDialog from "@/components/shared/PremiumWaitlistDialog";
import { useState } from 'react';
import { Box } from "@/components/ui/Box";
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

export default function HomePageClient() {
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-default">
      <AppBetaPopup />

      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        {/* New Hero Section - Personal Finance Health Check */}
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-16 md:mb-24">
          {/* Left Column: New Value Prop */}
          <div className="w-full md:w-2/5 text-center md:text-left">
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

          <div className="w-full md:w-3/5">
            <div className="mb-4">
              <Image
                src="/es_dashboard_close.webp"
                alt="Personal Finance Dashboard showing expense categorization and savings opportunities"
                width={415}
                height={409}
                className="w-full h-auto rounded-xl shadow-lg"
                sizes="(max-width: 768px) 100vw, 60vw"
                quality={100}
                priority
                unoptimized={true}
                style={{
                  imageRendering: 'crisp-edges',
                  WebkitFontSmoothing: 'antialiased',
                }}
              />
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100">
              <p className="text-sm text-gray-700 font-medium text-center">
                Join 10,000+ users taking control of their finances
              </p>
            </div>
          </div>
        </div>

        {/* Course CTA Banner */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-primary/5 rounded-3xl"></div>
          <Box variant="gradient" padding="xl" className="relative overflow-hidden border border-primary/10 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
            <div className="relative z-10">
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-8">
                  <span className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">New Course: Coming Soon</span>
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  I Went From Financial Chaos to{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">6-Month Emergency Fund</span>
                  {" "}in 18 Months
                </h2>
                
                <p className="text-xl lg:text-2xl text-gray-700 mb-4 font-medium">
                  Copy my exact 15-minute monthly system that runs on autopilot
                </p>
                
                <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                  Join the waitlist and get <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded">Module 1 absolutely free</span> — 
                  the foundation that changed everything.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                  <Link
                    href="/course"
                    className="group relative inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 min-w-[280px]"
                  >
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    <span className="relative flex items-center">
                      Get Module 1 Free
                      <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </span>
                  </Link>
                  
                  <div className="text-center sm:text-left">
                    <div className="text-sm font-semibold text-gray-800 mb-1">
                      Join 50+ early access members
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      No spam, just value
                    </div>
                  </div>
                </div>
                
                {/* Social Proof Pills */}
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-gray-700">💰 Average savings: $400/month</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-gray-700">⏱️ Setup time: 15 minutes</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-gray-700">🎯 Success rate: 94%</span>
                  </div>
                </div>
              </div>
            </div>
          </Box>
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
            15 Minutes a Month to Financial Control
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            Keep the power and flexibility of your spreadsheet while adding AI-powered insights. 
            Spend just 15 minutes monthly to stay on top of your finances.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Step 1: Get Started with Dashboard */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center relative h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-indigo-600">1</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Get Started with Dashboard</h3>
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
                    Upload your bank statements and see where your money really goes with beautiful charts and insights.
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

            {/* Step 2: Auto-Categorize */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center relative h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Auto-Categorize</h3>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    AI Powered
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
                    Let AI automatically categorize your transactions and sync everything back to your Google Sheet.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3 text-xs">
                    <div className="bg-white/80 px-2 py-1 rounded">
                      <span className="text-gray-600">Smart categorization</span>
                    </div>
                    <div className="bg-white/80 px-2 py-1 rounded">
                      <span className="text-gray-600">Sheet sync</span>
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
                    Track your financial runway and watch your savings grow with clear insights and actionable plans.
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Emergency fund tracking
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Debt payoff plans
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Financial runway calculator
                    </div>
                  </div>
                </div>
              </div>
            </Box>
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
            {/* Financial Overview Dashboard */}
            <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/95 backdrop-blur-sm">
              <div className="mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Overview Dashboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Perfect combination of spreadsheet control and AI insights. Keep your sheets, supercharge your analysis.
                </p>
                <div className="space-y-2 text-left text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Upload bank statements
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    AI categorization
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Sync to Google Sheets
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Beautiful analytics
                  </div>
                </div>
              </div>
              <Link
                href="/personal-finance"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md group-hover:shadow-lg"
              >
                Get Started
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
                <DollarSign className="h-8 w-8" />
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "I discovered I was spending $400/month on subscriptions I forgot about! Expense Sorted helped me build a $5,000 emergency fund in just 6 months."
              </blockquote>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full mr-3 flex-shrink-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url('/testimonial-alex.jpg')"
                  }}
                ></div>
                <div>
                  <p className="font-semibold">Alex M.</p>
                  <p className="text-xs text-gray-500">Software Engineer → Built $5K Emergency Fund</p>
                </div>
              </div>
            </Box>
            
            {/* Time Freedom Testimonial */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-blue-600">
                <Clock className="h-8 w-8" />
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "Before Expense Sorted, I spent hours every month categorizing transactions. Now it's automated and I actually understand where my money goes!"
              </blockquote>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full mr-3 flex-shrink-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url('/testimonial-sarah.jpg')"
                  }}
                ></div>
                <div>
                  <p className="font-semibold">Sarah L.</p>
                  <p className="text-xs text-gray-500">Small Business Owner → Saves 5+ Hours/Month</p>
                </div>
              </div>
            </Box>
            
            {/* Debt Freedom Success */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-purple-600">
                <TrendingUp className="h-8 w-8" />
              </div>
              <blockquote className="text-gray-700 flex-1 mb-4">
                "The insights from my spending analysis showed me exactly where to cut back. I paid off $15,000 in credit card debt 2 years ahead of schedule!"
              </blockquote>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full mr-3 flex-shrink-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url('/testimonial-liam.jpg')"
                  }}
                ></div>
                <div>
                  <p className="font-semibold">Mike R.</p>
                  <p className="text-xs text-gray-500">Teacher → Debt Free 2 Years Early</p>
                </div>
              </div>
            </Box>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">
              Ready to take control of your finances?
            </p>
            <Link
              href="/personal-finance"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-xl transition-all duration-200 text-lg"
            >
              Get Started Now
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </Box>

        {/* F*** You Money Calculator CTA */}
        <Box variant="gradient" padding="lg" className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Calculate Your "F*** You Money"
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                How much money do you need to have total financial freedom? Use our calculator to find out your exact number and create a plan to get there.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8 text-gray-900">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">25x</div>
                  <div className="text-sm text-gray-600">Annual Expenses Rule</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">4%</div>
                  <div className="text-sm text-gray-600">Safe Withdrawal Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">Free</div>
                  <div className="text-sm text-gray-600">No Signup Required</div>
                </div>
              </div>

            <Link
              href="/fuck-you-money-sheet"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
            >
              Get Started Now
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* Business Version Teaser */}
        <Box variant="bordered" padding="lg" className="mb-16 border-2 border-blue-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Business Edition in Development
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're building a specialized version for <span className="font-semibold text-blue-600">freelancers</span>, 
              <span className="font-semibold text-blue-600"> sole traders</span>, and 
              <span className="font-semibold text-blue-600"> small businesses</span>. 
              Get the same AI-powered insights, but designed for business expenses, tax deductions, and profit tracking.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-gray-900">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="font-semibold mb-1">Tax-Ready Categories</div>
                <div className="text-sm text-gray-600">Business expense categorization for tax time</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className="font-semibold mb-1">Profit & Loss Tracking</div>
                <div className="text-sm text-gray-600">See your business financial health at a glance</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div className="font-semibold mb-1">Invoice Integration</div>
                <div className="text-sm text-gray-600">Connect income and expenses automatically</div>
              </div>
            </div>

            <Link
              href="/business-finance"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-xl transition-all duration-200 text-lg"
            >
              Request Beta Access
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
            
            <p className="text-sm text-gray-500 mt-4">
              Join the waitlist to be notified when the business edition launches
            </p>
          </div>
        </Box>

        {/* References Section */}

          <References />

      </main>

      {/* Premium Waitlist Dialog */}
      <PremiumWaitlistDialog 
        isOpen={isWaitlistDialogOpen} 
        onClose={() => setIsWaitlistDialogOpen(false)} 
      />
    </div>
  );
}
