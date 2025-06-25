"use client";
import { useState, useEffect } from 'react';
import { Box } from "@/components/ui/Box";
import { Lock, CheckCircle, Clock, ArrowRight, PlayCircle } from 'lucide-react';
import PricingSection from "@/components/shared/PricingSection";
import StayUpToDate from "@/app/fuck-you-money-sheet/stayUpToDate";
import Image from 'next/image';
import Link from 'next/link';

export default function Module1Page() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Simple password check (you'll send this in the email)
  const SIMPLE_PASSWORD = 'MONEY2025'; // Change this regularly

  useEffect(() => {
    // Check if already unlocked in this session
    const unlocked = sessionStorage.getItem('module1Unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toUpperCase() === SIMPLE_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem('module1Unlocked', 'true');
      setError('');
    } else {
      setError('Incorrect password. Check your email for the access code.');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center px-4">
        <Box variant="lifted" padding="xl" className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Module 1: The 15-Minute Money System
            </h1>
            <p className="text-gray-600">
              Enter the access code from your email
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="text"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            >
              Unlock Module
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Didn't get the email? Check your spam folder or{' '}
            <a href="/course" className="text-primary hover:underline">
              sign up again
            </a>
          </p>
        </Box>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        
        {/* Welcome Section */}
        <section className="mb-12">
          <Box variant="lifted" padding="lg">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full"></span>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Free Module</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Module 1: The 15-Minute Monthly Money Review
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              Welcome! You're about to learn the exact system I use to manage my finances in just 15 minutes per month.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-gray-700">30 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-gray-700">Actionable steps</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-secondary" />
                <span className="text-gray-700">Immediate results</span>
              </div>
            </div>
          </Box>
        </section>

        {/* Video Section */}
        <section className="mb-12">
          <Box variant="elevated" padding="sm">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center relative overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/4JFXvKa1IFw?rel=0&modestbranding=1"
                title="Module 1: The 15-Minute Monthly Money Review"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl"
              ></iframe>
            </div>
          </Box>
        </section>

        {/* Action Steps with Images */}
        <section className="mb-12">
          <div className="space-y-8 md:space-y-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Your Step-by-Step Workflow
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Follow these exact steps to transform your financial chaos into a clear, automated system
              </p>
            </div>
            
            {/* Step 1 - Access Dashboard */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Access Your Dashboard
                </h3>
              </div>
              <p className="text-gray-700 mb-6">
                Head over to{' '}
                <Link 
                  href="/personal-finance" 
                  className="text-primary hover:text-primary-dark underline font-medium"
                >
                  the dashboard
                </Link>{' '}
                and click "Manage Data" to get started with your financial analysis.
              </p>
              <div className="max-w-4xl mx-auto">
                <Image
                  width={1433}
                  height={1207}
                  src="/es_financial_overview_dashboard.png"
                  className="rounded-lg shadow-lg w-full h-auto"
                  alt="Financial overview dashboard"
                  quality={100}
                />
              </div>
            </Box>

            {/* Step 2 - Upload Bank Data */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-secondary to-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Upload Your Bank Statements
                </h3>
              </div>
              <p className="text-gray-700 mb-6">
                Download CSV files from your bank and upload them through the web app. The system will automatically map your columns and prepare your data for categorization.
              </p>
              <div className="max-w-4xl mx-auto">
                <Image
                  width={1433}
                  height={1207}
                  src="/es_bank_import_mapping.png"
                  className="rounded-lg shadow-lg w-full h-auto"
                  alt="Bank import mapping interface showing CSV upload and column mapping"
                  quality={100}
                />
              </div>
            </Box>

            {/* Step 3 - AI Categorization */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Review AI Categorization
                </h3>
              </div>
              <p className="text-gray-700 mb-6">
                Our AI automatically categorizes your transactions based on merchant names and descriptions. Review and adjust any suggestions to match your preferences - this trains the system for better future accuracy.
              </p>
              <div className="max-w-4xl mx-auto">
                <Image
                  width={1433}
                  height={1207}
                  src="/es_ex_suggestion_adjustment.png"
                  className="rounded-lg shadow-lg w-full h-auto"
                  alt="AI categorization interface showing expense suggestions and adjustments"
                  quality={100}
                />
              </div>
            </Box>

            {/* Step 4 - Analysis */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-secondary to-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                  4
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Analyze Your Financial Picture
                </h3>
              </div>
              <p className="text-gray-700 mb-6">
                Review your categorized transactions and analyze your financial runway, income, expenses by category, and savings rate. This becomes your baseline for improvement.
              </p>
              <div className="max-w-4xl mx-auto">
                <Image
                  width={1433}
                  height={1207}
                  src="/es_category_selection.png"
                  className="rounded-lg shadow-lg w-full h-auto"
                  alt="Category selection and financial analysis interface"
                  quality={100}
                />
              </div>
            </Box>

            {/* Result */}
            <Box variant="gradient" padding="lg">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  🎯 Your Financial Baseline
                </h3>
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                  Now you have a clear picture of where your money goes each month. This is your starting point for optimization and building your emergency fund.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-lg mx-auto">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-primary">Next:</span> Reply to my email with your savings rate and biggest expense category!
                  </p>
                </div>
              </div>
            </Box>
          </div>
        </section>

        {/* Upgrade CTA */}
        <section className="mb-12">
          <Box variant="lifted" padding="xl" className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ready for the Full Course?
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                This is just the beginning. In the full 4-week course, you'll optimize your expenses, 
                automate your investments, and build a complete financial system.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/course"
                  className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                >
                  View Full Course Details
                </a>
                <a
                  href="#pricing"
                  className="px-8 py-3 bg-white text-primary font-semibold rounded-lg border-2 border-primary hover:bg-primary/5 transition-colors"
                >
                  See Pricing Below
                </a>
              </div>

              <p className="text-sm text-gray-600 mt-6">
                <span className="font-medium">Early bird special:</span> First 50 students get 50% off
              </p>
            </div>
          </Box>
        </section>

        {/* Pricing */}
        <div id="pricing">
          <PricingSection 
            showTitle={true}
            onJoinWaitlist={() => window.location.href = '/course#email-signup'}
          />
        </div>

        {/* Community Link */}
        <StayUpToDate />

      </main>
    </div>
  );
} 