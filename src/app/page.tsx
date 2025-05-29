"use client";
import Image from "next/image";
import References from "./components/References.js";
import FAQ from "./components/FAQ.js";
import Link from "next/link";
import Head from "next/head";
import AppBetaPopup from "@/components/shared/AppBetaPopup";
import PremiumWaitlistDialog from "@/components/shared/PremiumWaitlistDialog";
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Box } from "@/components/ui/Box";

export default function Home() {
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-default">
      <AppBetaPopup />
      <div className="container">
        <Head>
          <link rel="canonical" href="https://www.expensesorted.com/" />
        </Head>
      </div>

      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        {/* New Hero Section - Personal Finance Health Check */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
          {/* Left Column: New Value Prop */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">
                New: Personal Finance Health Check
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Get Your Finances Sorted in{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">3 Minutes</span>
            </h1>            
            
            <p className="text-xl text-gray-700 mb-8">
              Answer a few questions and discover exactly where your money goes, 
              how you compare to others, and get a personalized plan to save 
              <span className="font-semibold"> $3,000+</span> this year.
            </p>

            {/* Social Proof */}
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

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/personal-finance"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg text-lg"
              >
                Start Free Financial Check →
              </Link>
              
              <Link
                href="#tools"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Or Use Our Tools
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center md:text-left">
              No signup required. 100% free. Your data stays private.
            </p>
          </div>

          {/* Right Column: Hero Image */}
          <div className="w-full md:w-1/2">
            <div className="mb-4">
              <img
                src="/expense-sorted_tx_analysis.png"
                alt="Personal Finance Dashboard showing expense categorization and savings opportunities"
                className="w-full h-auto rounded-xl shadow-lg"
                loading="eager"
                width={600}
                height={400}
              />
            </div>
            
            {/* Social proof below image */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100">
              <p className="text-sm text-gray-700 font-medium text-center">
                Join 10,000+ users taking control of their finances
              </p>
            </div>
          </div>
        </div>


        {/* Already Budgeting Section */}
        <Box variant="bordered" padding="lg" className="mb-16 border-2 border-primary/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 mb-6">
              <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-sm font-medium text-secondary">
                Already Budgeting? Perfect!
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Supercharge Your Existing Setup
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              You're already on the right track! Now let our AI handle the tedious categorization 
              while you focus on making smart financial decisions.
            </p>

            {/* Tools Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Google Sheets */}
              <Box variant="elevated" padding="md" hoverable className="text-center group">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Image src="/Google_Sheets_2020_Logo.png" alt="Google Sheets" width={32} height={32} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Google Sheets Add-on</h3>
                <p className="text-gray-600 mb-4">One-click categorization directly in your spreadsheet</p>
                <div className="text-sm text-primary font-medium mb-4">
                  ✅ Works with existing sheets
                </div>
                <Link
                  href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                >
                  Get Free Add-on
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </Box>

              {/* Lunch Money */}
              <Box variant="elevated" padding="md" hoverable className="text-center group">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <Image src="/lunchmoney.png" alt="Lunch Money" width={32} height={32} className="rounded-lg" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Lunch Money Integration</h3>
                <p className="text-gray-600 mb-4">Enhanced AI categorization for your Lunch Money app</p>
                <div className="text-sm text-primary font-medium mb-4">
                  ✅ Direct sync & automation
                </div>
                <Link
                  href="/integrations"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                >
                  Connect Now
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Box>

              {/* Developer API */}
              <Box variant="elevated" padding="md" hoverable className="text-center group">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Developer API</h3>
                <p className="text-gray-600 mb-4">Build custom integrations with our categorization API</p>
                <div className="text-sm text-primary font-medium mb-4">
                  ✅ RESTful & well-documented
                </div>
                <Link
                  href="/api-landing"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  View Docs
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Link>
              </Box>
            </div>

            {/* Bottom CTA */}
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
                <div className="bg-gradient-to-r from-primary to-secondary rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-white font-bold text-xl md:text-2xl">1</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Get Your Financial Snapshot</h3>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
                FREE
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Get Your Financial Snapshot</h3>
              <p className="text-gray-600 text-center mb-4">Take our 3-minute Personal Finance Health Check. Answer a few questions and discover exactly where your money goes, how you compare to others, and get personalized insights.</p>
              <div className="mt-auto bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 w-full h-[280px] flex flex-col items-center justify-center">
                <div className="bg-white rounded-lg p-6 shadow-soft w-full max-w-sm">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">Your Financial Health</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spending vs Income</span>
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emergency Fund</span>
                      <span className="font-medium text-yellow-600">2.1 months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings Rate</span>
                      <span className="font-medium text-primary">15%</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href="/personal-finance"
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                Start Free Check →
              </Link>
              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807612 27.9792 0.807612 27.3934 1.3934C26.8076 1.97918 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="#E2E8F0"/>
                </svg>
              </div>
            </Box>

            {/* Step 2: Track & Categorize (Free Tools) */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center relative h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-white font-bold text-xl md:text-2xl">2</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Track & Categorize</h3>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
                FREE TOOLS
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Track & Categorize</h3>
              <p className="text-gray-600 text-center mb-4">Choose your preferred tool: Google Sheets add-on, Lunch Money integration, or our Developer API. All include AI-powered categorization to save you hours every month.</p>
              <div className="mt-auto bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 w-full h-[280px] flex flex-col items-center justify-center">
                <div className="grid grid-cols-3 gap-3 w-full">
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <Image src="/Google_Sheets_2020_Logo.png" alt="Google Sheets" width={24} height={24} className="mx-auto mb-2" />
                    <div className="text-xs font-medium text-gray-700">Sheets</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <Image src="/lunchmoney.png" alt="Lunch Money" width={24} height={24} className="mx-auto mb-2 rounded" />
                    <div className="text-xs font-medium text-gray-700">Lunch Money</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div className="text-xs font-medium text-gray-700">API</div>
                  </div>
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
              <Link
                href="#tools"
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all text-sm"
              >
                Choose Your Tool →
              </Link>
              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807612 27.9792 0.807612 27-3934 1.3934C26.8076 1.97918 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="#E2E8F0"/>
                </svg>
              </div>
            </Box>

            {/* Step 3: Automate & Optimize (Premium) */}
            <Box variant="elevated" padding="md" hoverable className="flex flex-col items-center h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-white font-bold text-xl md:text-2xl">3</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Automate & Optimize</h3>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1 rounded-full mb-3">
                PREMIUM
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Automate & Optimize</h3>
              <p className="text-gray-600 text-center mb-4">Unlock automated tracking, weekly insights, and personalized coaching. Let AI handle everything while you focus on building wealth.</p>
              <div className="mt-auto bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 w-full h-[280px] flex flex-col items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-soft w-full">
                  <div className="text-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">Premium Features</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-gray-600">Auto bank sync</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                      <span className="text-gray-600">Weekly insights</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full mr-2"></div>
                      <span className="text-gray-600">AI coaching</span>
                    </div>
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

          {/* Call to Action Highlight */}
          <div className="max-w-lg mx-auto mt-10 md:mt-12 text-center py-4">
            <div className="inline-block bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 font-semibold px-6 py-2 rounded-full text-sm mb-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Start your journey today
              </span>
            </div>
            <p className="text-gray-600 max-w-md mx-auto">Take the first step with our free Personal Finance Health Check.</p>
          </div>
        </Box>

        {/* Want More? Premium Features Section */}
        <Box variant="gradient" padding="lg" className="mb-16 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mb-6">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Want More? Premium Features
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Take Your Financial Game to the
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Next Level</span>
            </h2>
            
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Ready for advanced insights, automation, and personalized coaching? 
              Our premium features help you build lasting wealth.
            </p>

            {/* Premium Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Automated Tracking */}
              <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/80 backdrop-blur-sm">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Automated Tracking</h3>
                <p className="text-gray-600 mb-4">Connect your banks and cards for real-time expense tracking without manual uploads</p>
                <div className="text-sm text-primary font-medium mb-4">
                  ⚡ Real-time sync with 12,000+ banks
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium">
                  Coming Soon
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </Box>

              {/* Weekly Insights */}
              <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/80 backdrop-blur-sm">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                    <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Weekly Insights</h3>
                <p className="text-gray-600 mb-4">Get personalized spending reports and actionable recommendations delivered weekly</p>
                <div className="text-sm text-secondary font-medium mb-4">
                  📊 Custom reports + trend analysis
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 text-secondary font-medium">
                  Coming Soon
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </Box>

              {/* Personalized Coaching */}
              <Box variant="elevated" padding="md" hoverable className="text-center group bg-white/80 backdrop-blur-sm">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Personalized Coaching</h3>
                <p className="text-gray-600 mb-4">AI-powered financial coach that learns your goals and guides you to financial freedom</p>
                <div className="text-sm bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-medium mb-4">
                  🎯 Tailored advice for your situation
                </div>
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium">
                  Early Access
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
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
          </div>
        </Box>

        {/* Tools Section */}
        <Box variant="default" padding="lg" className="mb-16" id="tools">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Choose Your Financial Freedom Tool
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Google Sheets Add-on */}
            <Box variant="bordered" padding="md" hoverable>
              <div className="text-center mb-6">
                <Image src="/Google_Sheets_2020_Logo.png" alt="Google Sheets" width={48} height={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Google Sheets Add-on</h3>
                <p className="text-gray-600">Perfect for spreadsheet lovers</p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Works directly in Google Sheets
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  One-click categorization
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Your data stays secure
                </li>
              </ul>
              <button className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                Get Free Add-on
              </button>
            </Box>

            {/* Lunch Money Integration */}
            <Box variant="bordered" padding="md" hoverable>
              <div className="text-center mb-6">
                <Image src="/lunchmoney.png" alt="Lunch Money" width={48} height={48} className="mx-auto mb-4 rounded-lg" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Lunch Money Integration</h3>
                <p className="text-gray-600">Connect your existing Lunch Money</p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Direct integration
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automatic sync
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Enhanced categorization
                </li>
              </ul>
              <Link
                href="/integrations"
                className="block w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors text-center font-medium"
              >
                Connect Lunch Money
              </Link>
            </Box>

            {/* Developer API */}
            <Box variant="bordered" padding="md" hoverable>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Developer API</h3>
                <p className="text-gray-600">Build custom integrations</p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  RESTful API
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom budgeting apps
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Comprehensive docs
                </li>
              </ul>
              <Link href="/api-landing" className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center">
                View API Docs
              </Link>
            </Box>
          </div>
        </Box>

        {/* Benefits & Value Proposition Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Real Results, Real Savings
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Benefit 1: Save Money */}
            <Box variant="bordered" padding="md" hoverable className="flex">
              <div className="mr-5 shrink-0">
                <div className="bg-green-50 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Save $297+ Per Month</h3>
                <p className="text-gray-600">Identify hidden subscriptions, unnecessary expenses, and spending patterns that drain your bank account.</p>
              </div>
            </Box>
            
            {/* Benefit 2: Reclaim Time */}
            <Box variant="bordered" padding="md" hoverable className="flex">
              <div className="mr-5 shrink-0">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Reclaim Your Evenings</h3>
                <p className="text-gray-600">No more weekend spreadsheet marathons—spend time with family instead of categorizing transactions.</p>
              </div>
            </Box>
            
            {/* Benefit 3: Clear Financial Picture */}
            <Box variant="bordered" padding="md" hoverable className="flex">
              <div className="mr-5 shrink-0">
                <div className="bg-blue-50 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Crystal Clear Financial Picture</h3>
                <p className="text-gray-600">Finally understand your spending patterns and make confident financial decisions based on real data.</p>
              </div>
            </Box>
            
            {/* Benefit 4: Peace of Mind */}
            <Box variant="bordered" padding="md" hoverable className="flex">
              <div className="mr-5 shrink-0">
                <div className="bg-purple-50 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Peace of Mind</h3>
                <p className="text-gray-600">Sleep better knowing exactly where your money goes and that your financial future is secure.</p>
              </div>
            </Box>
          </div>

          {/* CTA Button */}
          <div className="mt-10 text-center">
            <a 
              href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try the Add-on Free
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </Box>

        {/* Integrations Section (Lunch Money Focus - Updated) */}
        <Box variant="gradient" padding="lg" className="mb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Text Content - Updated for Live Lunch Money */}
              <div className="md:w-1/2 space-y-6 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                   Love Lunch Money?
                </h2>
                <p className="text-lg text-gray-700">
                   Supercharge Lunch Money transaction categorization with Expense Sorted's AI.
                </p>
                {/* Updated Button */}
                <div className="pt-2">
                  <Link
                      href="/integrations" // Link to the integrations hub
                      className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-md"
                  >
                    Get Started Now
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
             </div>
              
              {/* Lunch Money Logo */}
              <div className="md:w-1/2 flex justify-center items-center">
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/lunchmoney.png"
                    width={250}
                    height={250}
                    alt="Lunch Money Logo"
                    className="max-w-[150px] md:max-w-[200px]"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </Box>

        {/* Free Spreadsheet Section */}
        <Box variant="gradient" padding="lg" className="mb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Text Content */}
              <div className="md:w-1/2 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Get Started with a Free Budget Template
                </h2>
                
                <p className="text-gray-600">
                  New to budgeting in Google Sheets? Our free Financial Freedom Spreadsheet gives you a ready-made template 
                  to track expenses, visualize your budget, and calculate how long your savings can last. It's the perfect 
                  companion to the Expense Sorted add-on.
                </p>
                
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <p className="text-sm font-medium text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Works even better with automatic categorization from the Expense Sorted add-on!
                  </p>
                </div>
                
                <div>
            <Link
                    href="/fuck-you-money-sheet"
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Free Template
            </Link>
                  
                  <p className="text-xs text-gray-500 mt-2">No signup required. Free download, no strings attached.</p>
                </div>
              </div>
              
              {/* Screenshot */}
              <div className="md:w-1/2">
                <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                  <Image
                    src="/f-you-money-expense-vs-savings.png"
                    width={600}
                    height={400}
                    alt="Financial Freedom Spreadsheet Template"
                    className="w-full"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </Box>

        {/* Product Demo Video */}
        <Box variant="default" padding="md" className="mb-16">
          <div className="aspect-video relative">
            <iframe
              src="https://www.youtube.com/embed/eaCIEWA44Fk"
              title="ExpenseSorted Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-xl"
            />
          </div>
          <div className="mt-6 text-center">
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

        {/* Core Benefits Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Use the "Financial Freedom Spreadsheet?"
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-4">Instant Clarity</h3>
              <p className="text-gray-600">Clearly see your expenses, savings, and how long you can afford freedom</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-4">Save Valuable Time</h3>
              <p className="text-gray-600">Automatic expense categorization replaces tedious manual tracking</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-4">Empowering Insights</h3>
              <p className="text-gray-600">Make smarter financial decisions with transparent data at your fingertips</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/fuck-you-money-sheet"
              className="inline-flex items-center px-6 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/5 transition-all duration-200"
            >
              Learn more about the spreadsheet
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* Developer API Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Integrate Our AI
          </h2>
          <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl mx-auto">
            Want to build custom financial tools or enhance your existing applications? Our robust API provides direct access to Expense Sorted's intelligent categorization engine. Clean merchant names, personalized models, and localized context at your fingertips.
          </p>
          <div className="text-center">
            <Link
              href="/api-landing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-soft hover:shadow-glow text-lg"
            >
              Explore Our API
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* Blog Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our Latest Insights
          </h2>
          <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl mx-auto">
            Check out our blog for articles on expense management, financial freedom, AI in finance, and product updates.
          </p>
          <div className="text-center">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg"
            >
              Visit Our Blog
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* Founder Message */}
        <Box variant="default" padding="lg" className="mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">A Message from the Founder</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              "I built this tool after realizing financial freedom isn't about becoming rich—it's about buying back your
              time. With clear expense tracking and the simplicity of knowing your financial runway, you can confidently
              pursue the life you truly want."
            </p>
            <div className="mt-6 text-right">
              <Link
                href="/fuck-you-money-sheet"
                className="text-primary hover:underline hover:text-primary-dark transition-all duration-200 font-medium"
              >
                Try it yourself →
              </Link>
            </div>
          </div>
        </Box>

        {/* Testimonials Section - Enhanced with faces and more details */}
        <Box variant="default" padding="lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Real People, Real Financial Transformation</h2>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-12 px-4">
            <div className="bg-gray-50 rounded-lg py-3 px-5 flex items-center border border-gray-200">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium">Google Workspace Verified</span>
            </div>            
            
            <div className="bg-gray-50 rounded-lg py-3 px-5 flex items-center border border-gray-200">
              <div className="text-yellow-400 mr-2">★★★★★</div>
              <span className="font-medium p-2">5/5 Rating</span>
            </div>
          </div>
          
          {/* Testimonials Grid - Focusing on financial transformation outcomes */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Financial Freedom Testimonial */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-600 mb-auto">
                "I discovered I was spending $400+ monthly on subscriptions I forgot about. After using Expense Sorted for just 3 months, I've saved $1,200 and finally have money for my emergency fund."
              </p>
              <div className="flex items-center mt-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-auto">
                "I used to spend every Sunday organizing finances. Now I get 3+ hours back every week to spend with my kids. The peace of mind knowing my finances are sorted is priceless."
              </p>
              <div className="flex items-center mt-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                <Image
                  src="/testimonial-sarah.jpg"
                    width={40}
                    height={40}
                  alt="Sarah K."
                  className="w-full h-full object-cover"
                />
                </div>
                <div>
                  <p className="font-semibold">Sarah K.</p>
                  <p className="text-xs text-gray-500">Working Mom → Reclaimed 12+ Hours/Month</p>
                </div>
              </div>
            </Box>
            
            {/* Financial Clarity Testimonial */}
            <Box variant="bordered" padding="md" hoverable className="flex flex-col min-h-[280px]">
              <div className="mb-4 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-auto">
                "I went from financial stress and guessing where my money went to confidently planning my early retirement. Seeing my spending patterns clearly helped me cut $350/month and invest the difference."
              </p>
              <div className="flex items-center mt-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                <Image
                  src="/testimonial-liam.jpg"
                    width={40}
                    height={40}
                  alt="Liam R."
                  className="w-full h-full object-cover"
                />
                </div>
                <div>
                  <p className="font-semibold">Liam R.</p>
                  <p className="text-xs text-gray-500">Business Owner → On Track for Early Retirement</p>
                </div>
              </div>
            </Box>
          </div>
          
          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Your Financial Transformation
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Box>

        {/* FAQ Section */}
        <Box variant="default" padding="lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Common Questions</h2>
          <FAQ />
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Ready to take control of your financial future?</p>
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
