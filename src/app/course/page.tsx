"use client";
import { useState, useEffect } from 'react';
import { Box } from "@/components/ui/Box";
import { PlayCircle, CheckCircle, ArrowDown } from 'lucide-react';
import EmailSignupForm from "@/components/shared/EmailSignupForm";
import PricingSection from "@/components/shared/PricingSection";

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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
                <span className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></span>
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">New Course: Coming Soon</span>
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
                  source="COURSE_LANDING"
                  tags={["course-interest", "module-1-request"]}
                  title=""
                  description=""
                  successMessage="Thanks! Check your email for Module 1"
                  buttonText="Get Module 1 Free"
                  placeholder="Enter your email"
                  className="text-left"
                  onSuccess={() => setIsEmailCaptured(true)}
                  isSuccess={isEmailCaptured}
                />
              </div>

              <p className="text-sm text-gray-500">
                Join 50+ early access members • No spam, just value
              </p>
            </div>

            {/* Right Column - Video/Demo */}
            <div className="w-full lg:w-1/2">
              <Box variant="elevated" padding="sm" className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl relative overflow-hidden">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover rounded-xl"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f3f4f6'/%3E%3Ctext x='400' y='225' font-family='Arial, sans-serif' font-size='20' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3EDemo Video Loading...%3C/text%3E%3C/svg%3E"
                  >
                    {/* Placeholder for actual video source */}
                    <source src="/demo-video.mp4" type="video/mp4" />
                    <source src="/demo-video.webm" type="video/webm" />
                    
                    {/* Fallback for browsers that don't support video */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      <div className="text-center text-white">
                        <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <p className="text-sm">Your browser doesn't support video</p>
                      </div>
                    </div>
                  </video>
                  
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                    2:30 Demo
                  </div>
                  
                  {/* Optional: Video controls overlay */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        const video = e.currentTarget.closest('.aspect-video')?.querySelector('video');
                        if (video) {
                          if (video.paused) {
                            video.play();
                          } else {
                            video.pause();
                          }
                        }
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                      aria-label="Play/Pause"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
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
                          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 1: Foundation & Quick Wins</h3>
                  <p className="text-sm text-gray-600">Get your numbers and see immediate results</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• The 15-Minute Setup</div>
                <div className="text-sm text-gray-700">• The Three Key Numbers</div>
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-primary">Deliverable:</span> Your personal finance dashboard
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 2 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-secondary font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 2: Optimization</h3>
                  <p className="text-sm text-gray-600">Find $200-500 in monthly savings</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Housing & Transportation Audit</div>
                <div className="text-sm text-gray-700">• The Subscription Purge</div>
                <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/10 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-secondary">Deliverable:</span> $200-500 monthly savings identified
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 3 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 3: Automation & Investment</h3>
                  <p className="text-sm text-gray-600">Set up your wealth-building machine</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Simple Investment Setup</div>
                <div className="text-sm text-gray-700">• Complete Financial Automation</div>
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-primary">Deliverable:</span> Full automation system running
                  </p>
                </div>
              </div>
            </Box>

            {/* Week 4 */}
            <Box variant="lifted" padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-secondary font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Week 4: Long-term Systems</h3>
                  <p className="text-sm text-gray-600">Your custom maintenance system</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">• Goal Tracking & Projections</div>
                <div className="text-sm text-gray-700">• Your Custom System</div>
                <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/10 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-secondary">Deliverable:</span> Your complete 15-minute system
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
        <PricingSection onJoinWaitlist={scrollToSignup} />

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
                source="COURSE_LANDING"
                tags={["course-interest", "module-1-request"]}
                title=""
                description=""
                successMessage="Thanks! Check your email for Module 1"
                buttonText="Get Module 1 Free"
                placeholder="Enter your email"
                className="text-center"
                onSuccess={() => setIsEmailCaptured(true)}
                isSuccess={isEmailCaptured}
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