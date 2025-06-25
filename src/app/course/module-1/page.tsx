"use client";
import { useState, useEffect } from 'react';
import { Box } from "@/components/ui/Box";
import { Lock, CheckCircle, Clock, ArrowRight, PlayCircle } from 'lucide-react';
import PricingSection from "@/components/shared/PricingSection";
import StayUpToDate from "@/app/fuck-you-money-sheet/stayUpToDate";

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
              {/* Placeholder until you add your YouTube video */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <p className="text-lg font-medium">Module 1: The 15-Minute System</p>
                  <p className="text-sm opacity-75">Replace this with your YouTube embed</p>
                </div>
              </div>
              {/* 
              Uncomment and replace YOUR_VIDEO_ID when ready:
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?rel=0&modestbranding=1"
                title="Module 1: The 15-Minute Monthly Money Review"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl"
              ></iframe>
              */}
            </div>
          </Box>
        </section>

        {/* Action Steps */}
        <section className="mb-12">
          <Box variant="lifted" padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Action Steps
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Download your bank statements
                  </h3>
                  <p className="text-gray-600">
                    Get last month's statements from all your accounts (checking, savings, credit cards)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Calculate your three numbers
                  </h3>
                  <p className="text-gray-600">
                    Total income, total expenses, and savings rate (I'll show you how in the video)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Reply to my email
                  </h3>
                  <p className="text-gray-600">
                    Share your savings rate - I read every response and will help if you're stuck
                  </p>
                </div>
              </div>
            </div>
          </Box>
        </section>

        {/* Resources */}
        <section className="mb-12">
          <Box variant="bordered" padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Module Resources
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <a href="#" className="block p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-lg hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-900 mb-1">
                  📊 Monthly Review Template
                </h3>
                <p className="text-sm text-gray-600">
                  The exact spreadsheet I use for tracking
                </p>
              </a>

              <a href="#" className="block p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/10 rounded-lg hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-900 mb-1">
                  🔄 Bank Import Guide
                </h3>
                <p className="text-sm text-gray-600">
                  How to download and organize statements
                </p>
              </a>

              <a href="#" className="block p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-lg hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-900 mb-1">
                  🎯 Category Cheatsheet
                </h3>
                <p className="text-sm text-gray-600">
                  My 8-category system explained
                </p>
              </a>

              <a href="#" className="block p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/10 rounded-lg hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-900 mb-1">
                  ❓ Common Questions
                </h3>
                <p className="text-sm text-gray-600">
                  FAQ from other students
                </p>
              </a>
            </div>
          </Box>
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