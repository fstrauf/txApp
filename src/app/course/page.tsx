"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';
import { Box } from "@/components/ui/Box";
import { Clock, DollarSign, TrendingUp, CheckCircle, PlayCircle, Users, Star, ArrowRight } from 'lucide-react';

export default function CoursePage() {
  const [isEmailCaptured, setIsEmailCaptured] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email capture logic
    setIsEmailCaptured(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        
        {/* Hero Section */}
        <section className="relative mb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Column */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 mb-6">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-secondary">New Course: Coming Soon</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                I Went From{" "}
                <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Financial Chaos</span>
                {" "}to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">6-Month Runway</span>
                {" "}in 18 Months
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-700 mb-8 font-medium">
                Copy my exact 15-minute monthly system that runs on autopilot
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15 min</div>
                  <div className="text-sm text-gray-600">Monthly review</div>
                </div>
                <div className="border-l border-gray-300 h-12"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">30 days</div>
                  <div className="text-sm text-gray-600">To complete</div>
                </div>
                <div className="border-l border-gray-300 h-12"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">$3000+</div>
                  <div className="text-sm text-gray-600">Saved per year</div>
                </div>
              </div>

              {!isEmailCaptured ? (
                <form onSubmit={handleEmailSubmit} className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto lg:mx-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Get Module 1 Free
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 max-w-md mx-auto lg:mx-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Thanks! Check your email for Module 1</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Join 50+ early access members • No spam, just value
              </p>
            </div>

            {/* Right Column - Video/Demo */}
            <div className="w-full lg:w-1/2">
              <Box variant="elevated" padding="sm" className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-white opacity-90 hover:opacity-100 cursor-pointer transition-opacity" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                    2:30 Demo
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 font-medium">
                    Watch: My 15-minute monthly system in action
                  </p>
                </div>
              </Box>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <Box variant="lifted" padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                The Problem
              </h2>
              <ul className="space-y-4">
                <li className="text-gray-700">• No idea where your money actually goes each month</li>
                <li className="text-gray-700">• Hours wasted on complicated spreadsheets that break</li>
                <li className="text-gray-700">• Constant money stress and living paycheck to paycheck</li>
                <li className="text-gray-700">• Budgeting apps that don't match your real life</li>
              </ul>
            </Box>

            <Box variant="lifted" padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                The Solution
              </h2>
              <ul className="space-y-4">
                <li className="text-gray-700">• 15-minute monthly reviews that actually work</li>
                <li className="text-gray-700">• Automated categorization with developer-built tools</li>
                <li className="text-gray-700">• Clear runway visibility and goal tracking</li>
                <li className="text-gray-700">• Minimalist philosophy that reduces complexity</li>
              </ul>
            </Box>
          </div>
        </section>

        {/* Course Structure */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The 4-Week Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build your personal finance system in 30 days - automate everything in just 15 minutes per month
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Week 1 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 1: Foundation & Quick Wins</h3>
                  <p className="text-sm text-gray-600">Get your numbers and see immediate results</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• The 15-Minute Setup</div>
                <div className="text-sm text-gray-700">• The Three Key Numbers</div>
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Deliverable: Your personal finance dashboard
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 2 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 2: Optimization</h3>
                  <p className="text-sm text-gray-600">Find $200-500 in monthly savings</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Housing & Transportation Audit</div>
                <div className="text-sm text-gray-700">• The Subscription Purge</div>
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Deliverable: $200-500 monthly savings identified
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 3 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 3: Automation & Investment</h3>
                  <p className="text-sm text-gray-600">Set up your wealth-building machine</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Simple Investment Setup</div>
                <div className="text-sm text-gray-700">• Complete Financial Automation</div>
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Deliverable: Full automation system running
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 4 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-700 font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 4: Long-term Systems</h3>
                  <p className="text-sm text-gray-600">Your custom maintenance system</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Goal Tracking & Projections</div>
                <div className="text-sm text-gray-700">• Your Custom System</div>
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    Deliverable: Your complete 15-minute system
                  </p>
                </div>
              </div>
            </Box>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mb-20">
          <Box variant="lifted" padding="lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Real Results from Beta Students
              </h2>
              <p className="text-gray-600">
                Join the waitlist to be among the first 50 students (50% off early bird pricing)
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/50 rounded-xl p-6 shadow-sm border border-gray-100/50 backdrop-blur-sm">
                <p className="text-gray-700 mb-4">
                  "Finally, a system that actually works! Found $400 in subscriptions I forgot about in week 2."
                </p>
                <div>
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-600">Marketing Manager</p>
                </div>
              </div>

              <div className="bg-white/50 rounded-xl p-6 shadow-sm border border-gray-100/50 backdrop-blur-sm">
                <p className="text-gray-700 mb-4">
                  "Went from financial anxiety to a 3-month emergency fund. The automation is genius!"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">Mike R.</p>
                  <p className="text-sm text-gray-600">Software Developer</p>
                </div>
              </div>

              <div className="bg-white/50 rounded-xl p-6 shadow-sm border border-gray-100/50 backdrop-blur-sm">
                <p className="text-gray-700 mb-4">
                  "Love how this integrates with my existing spreadsheet. No need to change everything!"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">Jessica L.</p>
                  <p className="text-sm text-gray-600">Teacher</p>
                </div>
              </div>
            </div>
          </Box>
        </section>

        {/* Pricing */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Early Bird Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Get lifetime access to the complete system
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Box variant="default" padding="lg" className="relative">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Early Bird</h3>
              <p className="text-gray-600 mb-6">First 50 students only</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">$147</span>
                <span className="text-gray-500 line-through ml-2">$197</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Complete 4-week course</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">All templates & worksheets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">MCP automation tools</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-gray-200 text-gray-600 font-semibold rounded-xl cursor-not-allowed">
                Join Waitlist
              </button>
            </Box>

            <Box variant="bordered" padding="lg" className="relative border-2 border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Regular</h3>
              <p className="text-gray-600 mb-6">Full access</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">$197</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Everything in Early Bird</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Priority email support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Bonus: Investment calculator</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                Join Waitlist
              </button>
            </Box>

            <Box variant="default" padding="lg" className="relative">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
              <p className="text-gray-600 mb-6">Includes 1-on-1 setup call</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">$297</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Everything in Regular</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">1-hour setup call with me</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Custom automation setup</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-gray-200 text-gray-600 font-semibold rounded-xl cursor-not-allowed">
                Join Waitlist
              </button>
            </Box>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <Box variant="lifted" padding="xl" className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Ready to Get Your Finances Sorted?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join the waitlist to be among the first to access the course when it launches. 
              Plus, get Module 1 free right now.
            </p>
            
            {!isEmailCaptured ? (
              <form onSubmit={handleEmailSubmit} className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Get Module 1 Free
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-xl p-6 mb-6 max-w-md mx-auto border border-green-200">
                <div className="flex items-center gap-3 justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-800 font-medium">Thanks! Check your email for Module 1</span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              <span className="font-medium">Limited time:</span> First 50 students get 50% off • No spam, just value
            </p>
          </Box>
        </section>

      </main>
    </div>
  );
} 