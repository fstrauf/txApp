"use client";
import Image from "next/image";
import Link from "next/link";
import { Box } from "@/components/ui/Box";
import { Header } from '@/components/ui/Header';

// Note: Since this is a client component, metadata needs to be in a separate file
// The metadata will be handled by a metadata.ts file in the same directory

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background-default">
      <main className="w-full px-4 py-8 md:py-16 md:container md:mx-auto md:max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
                  <Header 
                    variant="gradient"
                    size="xl"
                    badge={{
                      text: "Your Financial Health Report",
                      variant: "info"
                    }}
                    subtitle="Experience the power of AI-driven expense categorization"
                  >
                    Try out Expense Sorted
                  </Header>
        </div>

        {/* Demo Video/GIF Section */}
        <Box variant="elevated" padding="lg" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Categorization in Action
            </h2>
            <p className="text-lg text-gray-600">
              Watch transactions get categorized automatically in seconds
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/hero expense sorted.gif"
                width={1920}
                height={1080}
                alt="ExpenseSorted AI categorization demo"
                className="w-full"
                priority
              />
            </div>
          </div>
        </Box>

        {/* Step-by-Step Demo */}
        <Box variant="default" padding="lg" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Box variant="elevated" padding="md" className="text-center">
              <div className="bg-gradient-to-r from-primary to-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Import Your Data</h3>
              <p className="text-gray-600 mb-4">
                Upload your bank transactions via CSV, connect your bank account, or use our Google Sheets add-on.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
                <Image
                  src="/f-you-money-import-transactions.png"
                  width={300}
                  height={200}
                  alt="Import transactions demo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </Box>

            {/* Step 2 */}
            <Box variant="elevated" padding="md" className="text-center">
              <div className="bg-gradient-to-r from-primary to-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Categorizes</h3>
              <p className="text-gray-600 mb-4">
                Our AI instantly categorizes all your transactions with 95%+ accuracy. No manual rules needed.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
                <Image
                  src="/f-you-money-categorise-transactions.png"
                  width={300}
                  height={200}
                  alt="AI categorization demo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </Box>

            {/* Step 3 */}
            <Box variant="elevated" padding="md" className="text-center">
              <div className="bg-gradient-to-r from-primary to-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Insights</h3>
              <p className="text-gray-600 mb-4">
                See exactly where your money goes and identify opportunities to save hundreds per month.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
                <Image
                  src="/f-you-money-analyse-transactions.png"
                  width={300}
                  height={200}
                  alt="Financial analysis demo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </Box>
          </div>
        </Box>

        {/* Live Demo CTAs */}
        <Box variant="gradient" padding="lg" className="mb-16 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Try It Yourself?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Choose your preferred way to experience ExpenseSorted
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Google Sheets Demo */}
              <Box variant="elevated" padding="md" hoverable className="text-center">
                <Image src="/Google_Sheets_2020_Logo.png" alt="Google Sheets" width={48} height={48} className="mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Google Sheets Add-on</h3>
                <p className="text-gray-600 text-sm mb-4">Install our free add-on and try it with your own data</p>
                <Link
                  href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                >
                  Try Free Add-on
                </Link>
              </Box>

              {/* Personal Finance Check */}
              <Box variant="elevated" padding="md" hoverable className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Financial Health Check</h3>
                <p className="text-gray-600 text-sm mb-4">Get personalized insights in 3 minutes</p>
                <Link
                  href="/personal-finance"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all"
                >
                  Start Free Check
                </Link>
              </Box>

              {/* Full Platform */}
              <Box variant="elevated" padding="md" hoverable className="text-center">
                <Image src="/lunchmoney.png" alt="Integrations" width={48} height={48} className="mx-auto mb-4 rounded-lg" />
                <h3 className="text-lg font-semibold mb-2">Full Platform</h3>
                <p className="text-gray-600 text-sm mb-4">Connect your existing budgeting tools</p>
                <Link
                  href="/integrations"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  View Integrations
                </Link>
              </Box>
            </div>
          </div>
        </Box>

        {/* Social Proof */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">1,000+</div>
              <div className="text-sm text-gray-600">Active users</div>
            </div>
            <div className="border-l border-gray-300 h-12"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$297</div>
              <div className="text-sm text-gray-600">Avg. monthly savings</div>
            </div>
            <div className="border-l border-gray-300 h-12"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Accuracy rate</div>
            </div>
          </div>
          <p className="text-gray-600">
            Join thousands of users who've taken control of their finances with ExpenseSorted
          </p>
        </div>
      </main>
    </div>
  );
}
