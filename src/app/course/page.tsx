"use client";
import { useState, useEffect } from 'react';
import { Box } from "@/components/ui/Box";
import { PlayCircle, CheckCircle, ArrowDown } from 'lucide-react';
import EmailSignupForm from "@/components/shared/EmailSignupForm";

export default function CoursePage() {
  const [isEmailCaptured, setIsEmailCaptured] = useState(false);
  const [showEmailHighlight, setShowEmailHighlight] = useState(false);

  const scrollToSignup = () => {
    const signupSection = document.getElementById('email-signup');
    if (signupSection) {
      signupSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Show highlight animation
      setShowEmailHighlight(true);
      // Hide after animation
      setTimeout(() => {
        setShowEmailHighlight(false);
      }, 3000);
    }
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
                I Went From Financial Chaos to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">6-Month Emergency Fund</span>
                {" "}in 18 Months
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-700 mb-8 font-medium">
                Copy my exact 15-minute monthly system that runs on autopilot
              </p>
              

              <div className="max-w-md mx-auto lg:mx-0 mb-6">
                <EmailSignupForm
                  source="course-landing-hero"
                  tags={["course-interest", "module-1-request"]}
                  title=""
                  description=""
                  successMessage="Thanks! Check your email for Module 1"
                  buttonText="Get Module 1 Free"
                  placeholder="Enter your email"
                  className="text-left"
                  onSuccess={() => setIsEmailCaptured(true)}
                />
              </div>

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
                  <span className="text-gray-700">Automation tools</span>
                </li>
              </ul>
              <button 
                onClick={scrollToSignup}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
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
              <button 
                onClick={scrollToSignup}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
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
              <button 
                onClick={scrollToSignup}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Join Waitlist
              </button>
            </Box>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center" id="email-signup">
          <Box 
            variant="lifted" 
            padding="xl" 
            className={`max-w-4xl mx-auto transition-all duration-1000 ${
              showEmailHighlight 
                ? 'ring-4 ring-primary/30 ring-offset-4 ring-offset-white shadow-2xl bg-gradient-to-br from-primary/5 to-secondary/5' 
                : ''
            }`}
          >
            {showEmailHighlight && (
              <div className="mb-4 flex items-center justify-center gap-2 text-primary animate-bounce">
                <ArrowDown className="w-5 h-5" />
                <span className="text-sm font-medium">Enter your email below to join the waitlist</span>
                <ArrowDown className="w-5 h-5" />
              </div>
            )}
            
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Ready to Get Your Finances Sorted?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join the waitlist to be among the first to access the course when it launches. 
              Plus, get Module 1 free right now.
            </p>
            
            <div className={`max-w-lg mx-auto mb-6 transition-all duration-500 ${
              showEmailHighlight ? 'scale-105' : ''
            }`}>
              <EmailSignupForm
                source="course-landing-cta"
                tags={["course-interest", "module-1-request"]}
                title=""
                description=""
                successMessage="Thanks! Check your email for Module 1"
                buttonText="Get Module 1 Free"
                placeholder="Enter your email"
                className="text-center"
              />
            </div>

            <p className="text-sm text-gray-600">
              <span className="font-medium">Limited time:</span> First 50 students get 50% off • No spam, just value
            </p>
          </Box>
        </section>

      </main>
    </div>
  );
} 