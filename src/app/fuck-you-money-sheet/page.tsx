import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import GetItHereButton from "./getItHereButton";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "Financial Freedom Calculator - Smart Sheet + App System | Expense Sorted",
  description: "Transform your financial tracking with our smart Google Sheet + web app system. Keep control of your data while getting AI-powered insights, automatic categorization, and beautiful analytics.",
  alternates: {
    canonical: "/fuck-you-money-sheet",
  },
  openGraph: {
    title: "Financial Freedom Calculator - Smart Sheet + App System | Expense Sorted",
    description: "Transform your financial tracking with our smart Google Sheet + web app system. Keep control of your data while getting AI-powered insights, automatic categorization, and beautiful analytics.",
    url: "/fuck-you-money-sheet",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/es_og.png",
        alt: "Financial Freedom Calculator - Smart Sheet + App System",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Freedom Calculator - Smart Sheet + App System",
    description: "Transform your financial tracking with our smart Google Sheet + web app system. Keep control of your data while getting AI-powered insights.",
    images: ["/es_og.png"],
  },
};

export default function FinancialFreedomSheet() {
  return (
    <div className="min-h-screen bg-background-default overflow-x-hidden">
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
        <div className="bg-surface rounded-2xl shadow-soft p-4 md:p-8 space-y-8 md:space-y-12 max-w-full overflow-x-hidden">
          <PageHeader title="Financial Freedom - Smart Sheet + App System" />

          {/* Hero Section - App + Sheet Integration */}
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 rounded-2xl p-6 md:p-10 border border-primary/20 shadow-lg">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                The Best of Both Worlds
              </h2>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Keep complete control of your data in a Google Sheet while getting powerful analytics, 
                AI categorization, and beautiful insights through our web app.
              </p>
            </div>

            {/* Two-column comparison */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
              {/* Your Sheet - Control */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-primary/10 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 p-3 rounded-full mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Your Google Sheet</h3>
                </div>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>You own your data</strong> - Everything stays in your Google Sheet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Two key tabs:</strong> Transactions + Savings tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Full control:</strong> Edit, categorize, analyze directly</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Privacy first:</strong> No vendor lock-in</span>
                  </li>
                </ul>
              </div>

              {/* Our App - Supercharge */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 md:p-8 border border-primary/20 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/20 p-3 rounded-full mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Our Web App</h3>
                </div>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">⚡</span>
                    <span><strong>AI categorization:</strong> Auto-categorize transactions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">⚡</span>
                    <span><strong>Beautiful analytics:</strong> Charts, trends, insights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">⚡</span>
                    <span><strong>Smart imports:</strong> CSV upload & bank statement processing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">⚡</span>
                    <span><strong>Financial runway:</strong> Track your path to freedom</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Transform Your Finances?</h3>
                <p className="text-gray-700 text-lg">Start with the sheet, then supercharge it with our app</p>
                </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/personal-finance" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  Get Your Finances Under Control
                </Link>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-primary to-secondary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-semibold mb-4">Upload a Bank Statement</h3>
                <p className="text-gray-600 leading-relaxed">Upload a Bank Statement and map data to a unified structure.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-primary to-secondary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-semibold mb-4">Categorise your Expenses</h3>
                <p className="text-gray-600 leading-relaxed">Categorise expenses and automatically save them to your Google Sheet.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-primary to-secondary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-semibold mb-4">Get Financial Insights</h3>
                <p className="text-gray-600 leading-relaxed">Get financial insights and track your financial runway.</p>
              </div>
            </div>

            {/* Your Options */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-16">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">Choose Your Workflow</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Sheet-First Approach */}
                <div className="bg-white rounded-xl text-gray-900 p-6 shadow-sm border border-gray-200 flex flex-col">
                  <h4 className="text-xl font-bold mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Sheet-First Approach
                  </h4>
                  <ul className="space-y-3 text-gray-700 flex-1 mb-6">
                    <li>• Manually enter transactions in your sheet</li>
                    <li>• Categorize and analyze directly in Google Sheets</li>
                    <li>• Use built-in formulas for runway calculations</li>
                    <li>• Perfect for spreadsheet lovers who want full control</li>
                  </ul>
                  <div className="mt-auto">
                    <GetItHereButton showApiKeyButton={false} />
                  </div>
                </div>

                {/* App-Powered Approach */}
                <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-0.5 shadow-lg relative">
                  <div className="bg-white rounded-xl p-6 flex flex-col h-full">
                    <div className="absolute -top-3 right-4">
                      <span className="bg-gradient-to-br from-primary to-secondary text-white text-xs px-3 py-1 rounded-full font-medium">Recommended</span>
                    </div>
                    <h4 className="text-xl font-bold text-primary mb-4 flex items-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      App-Powered Approach
                    </h4>
                    <ul className="space-y-3 text-gray-700 flex-1 mb-6">
                      <li>• Upload bank statements & CSV files automatically</li>
                      <li>• AI categorizes transactions instantly</li>
                      <li>• Beautiful charts and financial insights</li>
                      <li>• Data syncs back to your sheet automatically</li>
                    </ul>
                    <div className="mt-auto">
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                          href="/personal-finance" 
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Get Your Finances Under Control
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Featured Testimonial */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 mb-12">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gray-200 mr-4 overflow-hidden flex-shrink-0">
                  <Image
                    src="/testimonial-featured.jpg"
                    width={56}
                    height={56}
                    alt="Jessie T."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-lg">Jessie T.</p>
                  <p className="text-gray-600">Software Engineer</p>
                </div>
              </div>
              <p className="text-gray-700 italic text-lg leading-relaxed">
                "I love that I can choose how to work with my data. Sometimes I prefer the spreadsheet for detailed analysis, 
                other times I use the app for quick uploads and beautiful charts. Having both options is perfect!"
              </p>
              <div className="flex mt-4">
                <span className="text-yellow-400 text-lg">★★★★★</span>
              </div>
            </div>
            <div className="prose prose-lg max-w-none mt-16 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark">
              <section id="instructions">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Step-by-Step Instructions</h2>

                {/* App-Powered Workflow */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 md:p-8 border border-primary/20 mb-12 not-prose">
                  
                  <div className="space-y-12">
                    {/* Step 1 */}
                    <div className="bg-white/50 rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">1</div>
                        <h4 className="text-xl font-semibold text-gray-900">Get Started with the Dashboard</h4>
                      </div>
                      <p className="text-gray-700 mb-6">Head over to <Link href="/personal-finance" className="text-primary hover:text-primary-dark underline font-medium">the dashboard</Link> and click manage data to get started.</p>
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
                    </div>

                    {/* Step 2a */}
                    <div className="bg-white/50 rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">2</div>
                        <h4 className="text-xl font-semibold text-gray-900">Upload and Map Your Bank Data</h4>
                      </div>
                      <p className="text-gray-700 mb-6">Upload your bank statements directly through the web app - if you don't have a copy of the sheet yet, don't worry, we'll create a new one with your transactions.</p>
                      <div className="max-w-4xl mx-auto">
                        <Image
                          width={1433}
                          height={1207}
                          src="/es_bank_import_mapping.png"
                          className="rounded-lg shadow-lg w-full h-auto"
                          alt="Bank import mapping interface"
                          quality={100}
                        />
                      </div>
                    </div>

                    {/* Step 3a */}
                    <div className="bg-white/50 rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">4</div>
                        <h4 className="text-xl font-semibold text-gray-900">Review AI Categorization</h4>
                      </div>
                      <p className="text-gray-700 mb-6">Our AI automatically categorizes your transactions. Review and adjust the suggestions to match your preferences. If you have existing data, the categorisation will be much more accurate.</p>
                      <div className="max-w-4xl mx-auto">
                        <Image
                          width={1433}
                          height={1207}
                          src="/es_ex_suggestion_adjustment.png"
                          className="rounded-lg shadow-lg w-full h-auto"
                          alt="Expense suggestion adjustment interface"
                          quality={100}
                        />
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white/50 rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">6</div>
                        <h4 className="text-xl font-semibold text-gray-900">Review Your Data</h4>
                      </div>
                      <p className="text-gray-700 mb-6">Review your data and get closer to your goals</p>
                      <div className="max-w-4xl mx-auto">
                        <Image
                          width={1433}
                          height={1207}
                          src="/es_category_selection.png"
                          className="rounded-lg shadow-lg w-full h-auto"
                          alt="Category selection interface"
                          quality={100}
                        />
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-lg p-6 border border-primary/10">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">✨ The Result</h4>
                      <p className="text-gray-700 mb-4">All your categorized data automatically syncs back to your Google Sheet, giving you the best of both worlds - powerful app features with full data ownership.</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link 
                          href="/personal-finance" 
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Try the App Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sheet-Only Workflow */}
                <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200 mb-12 not-prose">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Alternative: Sheet-Only Workflow
                  </h3>
                  
                  <p className="text-gray-700 mb-6">Prefer to work entirely within Google Sheets? You can still get AI-powered categorization with our extension.</p>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-700 mb-4">
                        Get the{" "}
                        <a
                          href="https://workspace.google.com/u/0/marketplace/app/expense_sorted/456363921097?flow_type=2"
                          className="text-primary hover:text-primary-dark underline font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Expense Sorted extension
                        </a>{" "}
                        from the Google Sheets™ Extension Marketplace
                      </p>
                      <Image
                        width={1306}
                        height={1230}
                        src="/f-you-money-expense-sorted-extension.png"
                        className="rounded-md shadow-lg w-full h-auto max-w-2xl"
                        alt="Google Sheets extension marketplace"
                      />
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Monthly Process:</h4>
                      <ol className="list-decimal ml-6 text-gray-700 space-y-4">
                        <li>
                          Start by training the model on your current expenses so it knows how to categorize your future expenses.
                          <div className="mt-4">
                            <Image
                              width={1306}
                              height={1229}
                              src="/f-you-money-expense-detail.png"
                              className="rounded-md shadow-lg w-full h-auto max-w-2xl"
                              alt="Training the expense categorization model"
                            />
                          </div>
                        </li>
                        <li>Add your new expenses from your bank account to the new_transactions sheet and categorize via the extension.</li>
                        <li>Copy all transactions to the Expense-Detail tab and adjust categories as needed.</li>
                        <li>Update the Monthly Expense tab with the new month's data.</li>
                        <li>Review your financial progress in the Expenses vs. Saving tab.</li>
                      </ol>
            </div>
            </div>
            </div>
            
                <p className="text-gray-700 mt-8">
                  To get into the right mindset, I recommend reading:{" "}
                  <a
                    href="https://ffstrauf.substack.com/p/fuck-you-money-doesnt-mean-you-need"
                    className="text-primary hover:text-primary-dark underline font-medium"
                  >
                    Financial Freedom Doesn't Mean You Need To Be Rich
                  </a>
                </p>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

