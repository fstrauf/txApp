import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import PageHeader from "../../components/PageHeader";
import AddOnButton from "../components/buttons/AddOnButton";

export const metadata: Metadata = {
  title: "Google Sheets AI Extension - Transaction Categorization | Expense Sorted",
  description: "Add AI-powered transaction categorization directly to your Google Sheets. Get started with our easy-to-install extension and API key setup guide.",
  alternates: {
    canonical: "/sheets-extension",
  },
  openGraph: {
    title: "Google Sheets AI Extension - Transaction Categorization | Expense Sorted",
    description: "Add AI-powered transaction categorization directly to your Google Sheets. Get started with our easy-to-install extension and API key setup guide.",
    url: "/sheets-extension",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 951,
        height: 635,
        alt: "Google Sheets AI Extension - Transaction Categorization",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Sheets AI Extension - Transaction Categorization",
    description: "Add AI-powered transaction categorization directly to your Google Sheets with our easy-to-install extension.",
    images: ["/opengraph-image.png"],
  },
};

export default function SheetsExtensionPage() {
  return (
    <div className="min-h-screen bg-background-default overflow-x-hidden">
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="bg-surface rounded-2xl shadow-soft p-6 md:p-10 space-y-10 md:space-y-12">
          <PageHeader title="Google Sheets AI Extension" />

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              AI-Powered Transaction Categorization
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Add intelligent transaction categorization directly to any Google Sheet. 
              Perfect for users who prefer working entirely within their spreadsheet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AddOnButton 
                size="md" 
                variant="primary" 
                text="Install Extension" 
                className="shadow-sm"
              />
              <Link 
                href="/personal-finance" 
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                Try Our Web App Instead
              </Link>
            </div>
          </div>

          {/* What It Does */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What the Extension Does</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Smart Categorization</h4>
                    <p className="text-gray-600">Automatically categorizes transactions based on merchant names and descriptions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Batch Processing</h4>
                    <p className="text-gray-600">Process hundreds of transactions with a single click</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Customizable Categories</h4>
                    <p className="text-gray-600">Define your own categories or use our smart defaults</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Privacy First</h4>
                    <p className="text-gray-600">Your data never leaves your Google Sheet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-10 text-center">Getting Started</h3>
            
            <div className="space-y-10">
              {/* Step 1 */}
              <div className="flex items-start gap-6">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Install the Extension</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Click the button below to install our Google Sheets extension from the Google Workspace Marketplace.
                  </p>
                  <AddOnButton 
                    size="md" 
                    variant="primary" 
                    text="Install from Marketplace" 
                    className="inline-flex"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-6">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Get Your API Key</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    You'll need an API key to use the AI categorization features. Here's how to get one:
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">a</span>
                        <p className="text-blue-800">
                          <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-800 underline">
                            Sign up for a free account
                          </Link> on our website
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">b</span>
                        <p className="text-blue-800">
                          Go to your <Link href="/personal-finance" className="font-medium text-blue-600 hover:text-blue-800 underline">
                            Personal Finance Dashboard
                          </Link> and click "Manage Data"
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">c</span>
                        <p className="text-blue-800">
                          In the Settings tab, find your API key or generate a new one
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">d</span>
                        <p className="text-blue-800">
                          Copy the API key and paste it into the extension settings
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Free Trial Included</p>
                        <p className="text-amber-700">
                          New users get a 14-day free trial with up to 1,000 transaction categorizations. 
                          Perfect for testing the extension with your data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-6">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Set Up Your Sheet</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    The extension works with any Google Sheet that has transaction data. Your sheet should have columns for:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 font-medium">Description</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 font-medium">Amount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 font-medium">Date</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 font-medium">Category (empty)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    💡 <strong>Tip:</strong> Download our 
                    <Link href="/fuck-you-money-sheet" className="text-primary hover:text-primary-dark font-medium underline ml-1">
                      smart Google Sheet template
                    </Link> which is already set up perfectly for the extension.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-6">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">4</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Start Categorizing</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Once installed and configured, you can categorize transactions right from your Google Sheet:
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Select the range of transactions you want to categorize</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Go to Extensions → Expense Sorted → Categorize Transactions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Watch as AI intelligently categorizes your transactions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Review and adjust categories as needed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Simple Pricing</h3>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-primary/10">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Pay Per Use</h4>
                  <p className="text-gray-600">Only pay for what you use, no monthly subscriptions</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-700">Per transaction categorized</span>
                    <span className="font-semibold text-gray-900">$0.01</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-700">Minimum purchase</span>
                    <span className="font-semibold text-gray-900">$5.00 (500 transactions)</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-700">14-day free trial</span>
                    <span className="font-semibold text-green-600">1,000 transactions</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-800 font-medium">
                      Most users spend $5-15/month for comprehensive transaction categorization
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h3>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Is my financial data safe?</h4>
                <p className="text-gray-600 leading-relaxed">
                  Yes, absolutely. The extension only processes transaction descriptions to suggest categories. 
                  Your data never leaves your Google Sheet and is never stored on our servers.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Can I use this with any Google Sheet?</h4>
                <p className="text-gray-600 leading-relaxed">
                  Yes! The extension works with any Google Sheet that has transaction data. 
                  You can customize which columns contain your transaction descriptions, amounts, and dates.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">How accurate is the AI categorization?</h4>
                <p className="text-gray-600 leading-relaxed">
                  Our AI is trained on millions of transactions and achieves 85-95% accuracy depending on your transaction types. 
                  You can always review and adjust categories as needed.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">What's the difference between this and your web app?</h4>
                <p className="text-gray-600 leading-relaxed">
                  The extension adds AI categorization to your existing Google Sheets workflow. 
                  Our web app provides additional features like automatic imports, advanced analytics, 
                  financial runway calculations, and expense insights. Choose based on your preference!
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gray-50 rounded-2xl p-8 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Install the extension and start your free trial today. No credit card required for the trial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AddOnButton 
                size="md" 
                variant="primary" 
                text="Install Extension" 
                className="shadow-sm"
              />
              <Link 
                href="/auth/signin" 
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 