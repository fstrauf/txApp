"use client";

import { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Box } from "@/components/ui/Box";
import EmailSignupForm from "@/components/shared/EmailSignupForm";
import { Building2, TrendingUp, FileText, Calculator, Users, Clock } from 'lucide-react';

export default function BusinessFinancePageClient() {
  const [showBetaForm, setShowBetaForm] = useState(false);

  return (
    <div className="min-h-screen bg-background-default">
      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-16 md:mb-24">
          <div className="w-full md:w-2/5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Coming Soon: Business Edition</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Business Finance{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              The same AI-powered financial insights you love, now designed for 
              <span className="font-semibold"> freelancers</span>, 
              <span className="font-semibold"> sole traders</span>, and 
              <span className="font-semibold"> small businesses</span>. 
              Automate your business expense tracking and get tax-ready in minutes.
            </p>

            <div className="flex items-center justify-center md:justify-start gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Time saved on bookkeeping</div>
              </div>
              <div className="border-l border-gray-300 h-12"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">$2,400</div>
                <div className="text-sm text-gray-600">Avg. tax deductions found</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={() => setShowBetaForm(true)}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-xl transition-all duration-200 text-lg"
              >
                Request Beta Access
              </button>
              <Link
                href="/personal-finance"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-all duration-200 text-lg"
              >
                Try Personal Version
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center md:text-left">
              Be among the first to access our business tools. No commitment required.
            </p>
          </div>

          <div className="w-full md:w-3/5">
            <div className="mb-4">
              <Image
                src="/es_dashboard_close.webp"
                alt="Business Finance Dashboard showing automated expense categorization and tax insights"
                width={415}
                height={409}
                className="w-full h-auto rounded-xl shadow-lg"
                sizes="(max-width: 768px) 100vw, 60vw"
                quality={100}
                priority
                unoptimized={true}
              />
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100">
              <p className="text-sm text-gray-700 font-medium text-center">
                Built specifically for business owners who value control and transparency
              </p>
            </div>
          </div>
        </div>

        {/* Perfect For Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Business Owners Who Value Control
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Stop wrestling with complex accounting software. Get the simplicity of spreadsheets with the power of AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Box variant="elevated" padding="md" hoverable className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Freelancers & Consultants</h3>
              <ul className="text-gray-600 space-y-2 text-left">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Track client expenses automatically</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Separate business from personal</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Tax-ready categorization</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Simple invoicing integration</li>
              </ul>
            </Box>

            <Box variant="elevated" padding="md" hoverable className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Small Businesses</h3>
              <ul className="text-gray-600 space-y-2 text-left">
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>Multi-account management</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>Team expense tracking</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>Profit & loss insights</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>Cash flow monitoring</li>
              </ul>
            </Box>

            <Box variant="elevated" padding="md" hoverable className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Growing Agencies</h3>
              <ul className="text-gray-600 space-y-2 text-left">
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span>Project-based expense tracking</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span>Client billing automation</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span>Profitability by project</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span>Team collaboration tools</li>
              </ul>
            </Box>
          </div>
        </Box>

        {/* Features Section */}
        <Box variant="gradient" padding="lg" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Everything You Need to Run Your Business Finances
            </h2>
            <p className="text-lg text-black/90 max-w-2xl mx-auto">
              Built on the same proven technology powering our personal finance app, but designed for business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Tax Categorization</h3>
              <p className="text-sm text-gray-600">Automatically categorize expenses for tax purposes. Never miss a deduction again.</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Receipt Management</h3>
              <p className="text-sm text-gray-600">Snap photos of receipts and let AI extract and categorize the data automatically.</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Insights</h3>
              <p className="text-sm text-gray-600">Track cash flow, profit margins, and business health with automated reports.</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Time Tracking</h3>
              <p className="text-sm text-gray-600">Log billable hours and automatically calculate project profitability.</p>
            </div>
          </div>
        </Box>

        {/* Beta Access Form Modal */}
        {showBetaForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Request Beta Access</h3>
                <button
                  onClick={() => setShowBetaForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <EmailSignupForm
                source="BUSINESS_BETA"
                tags={["business_beta", "early_access"]}
                title="Get Early Access"
                description="Be the first to know when our business edition launches. We'll send you exclusive beta access and special pricing."
                successMessage="Thanks! You're on the list for early access to our business edition."
                buttonText="Request Beta Access"
                placeholder="your.email@business.com"
                onSuccess={() => {
                  setTimeout(() => setShowBetaForm(false), 2000);
                }}
              />
            </div>
          </div>
        )}

        {/* Social Proof Section */}
        <Box variant="default" padding="lg" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built on Proven Technology
            </h2>
            <p className="text-lg text-gray-600">
              Our personal finance app already helps thousands of users save time and money
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Active users on personal app</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">$297</div>
              <div className="text-gray-600">Average monthly savings per user</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">5+ hours</div>
              <div className="text-gray-600">Saved per month on admin tasks</div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">
              Ready to bring this power to your business?
            </p>
            <button
              onClick={() => setShowBetaForm(true)}
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-xl transition-all duration-200 text-lg"
            >
              Join the Beta Waitlist
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </Box>

        {/* FAQ Section */}
        <Box variant="bordered" padding="lg" className="mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  When will the business edition be available?
                </h3>
                <p className="text-gray-600">
                  We're planning to launch the business beta in Q2 2024. Beta users will get early access and special pricing.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Will it integrate with my existing accounting software?
                </h3>
                <p className="text-gray-600">
                  Yes! We're building integrations with QuickBooks, Xero, and other popular accounting platforms. You'll also have full control of your data in Google Sheets.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How is this different from the personal version?
                </h3>
                <p className="text-gray-600">
                  The business edition includes tax-focused categorization, multi-account support, team features, invoice integration, and business-specific insights like profit/loss tracking.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What will the pricing be?
                </h3>
                <p className="text-gray-600">
                  We're still finalizing pricing, but beta users will receive significant discounts. We're committed to keeping it affordable for small businesses and freelancers.
                </p>
              </div>
            </div>
          </div>
        </Box>

      </main>
    </div>
  );
} 