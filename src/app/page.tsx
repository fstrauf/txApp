"use client";
import Image from "next/image";
import References from "./components/References.js";
import FAQ from "./components/FAQ.js";
import Link from "next/link";
import Head from "next/head";
import { FaGoogle } from "react-icons/fa";

export default function Home() {
  // Remove A/B test state
  // const [showAlternateButton, setShowAlternateButton] = useState(false);

  // Remove A/B test effect
  // useEffect(() => { ... }, []);

  return (
    <div className="min-h-screen bg-background-default">
      <div className="container">
        <Head>
          <link rel="canonical" href="https://www.expensesorted.com/" />
        </Head>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {/* Hero Section - AI Add-on Focus */}
        <div className="text-center mb-12 md:mb-16">
          {/* Updated Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            Automate Your Monthly Budgeting
            <br className="hidden md:block" />
            in{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Google Sheets with AI
            </span>
          </h1>
          {/* Updated Subheadline */}
          <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8 max-w-3xl mx-auto">
            <p className="text-lg md:text-xl text-gray-800">
              Categorize a month's transactions in seconds, not hours, directly in your spreadsheet.
            </p>
            {/* Removed the feature list div */}
          </div>

          {/* Primary and Secondary CTAs */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-3">
            {/* Primary CTA: Install Add-on */}
            <Link
              href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-lg w-full md:w-auto justify-center"
            >
              <FaGoogle className="mr-2 w-5 h-5" />
              Install the Add-on
            </Link>
            {/* Secondary CTA: Download Template */}
            <Link
              href="/fuck-you-money-sheet"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm w-full md:w-auto justify-center"
            >
              Download Free Template
              {/* Optional: Add an icon like download or spreadsheet */}
            </Link>
          </div>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto my-8 px-4">
            <div className="relative bg-white rounded-2xl p-8">
              <Image
                src="/hero expense sorted.gif"
                width={1920}
                height={1080}
                alt="AI-powered expense categorization in Google Sheets"
                className="w-full rounded-lg shadow-xl"
                priority={true}
                quality={100}
              />
            </div>
          </div>

          {/* Trust Statement */}
          <p className="text-sm text-gray-600">
            ✅ Your data stays in your Google Sheet – never leaves your control.
          </p>

          {/* Quick Social Proof */}
          <div className="mt-8 text-gray-600">
            <p>Over 1,000 people are already automating their budgeting</p>
          </div>
          {/* Removed old link section and paragraph */}
        </div>

        {/* Workflow Visualization Section - Monthly Process */}
        <div className="bg-white rounded-2xl shadow-soft p-4 md:p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            How It Works: Your Monthly Budget Workflow
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Step 1: Import */}
            <div className="flex flex-col items-center relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-primary/10 rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold text-xl md:text-2xl">1</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Import Transactions</h3>
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Import Transactions</h3>
              <p className="text-gray-600 text-center mb-4">Start by importing or pasting your monthly bank transactions into Google Sheets.</p>
              <div className="mt-auto bg-gray-50 rounded-lg p-3 w-full h-[300px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/f-you-money-import-transactions.png"
                  width={693}
                  height={400}
                  alt="Importing transactions into Google Sheets"
                  className="w-full object-contain max-h-full"
                />
              </div>
              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807612 27.9792 0.807612 27.3934 1.3934C26.8076 1.97918 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="#E2E8F0"/>
                </svg>
              </div>
            </div>

            {/* Step 2: Auto-Categorize */}
            <div className="flex flex-col items-center relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-primary/10 rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold text-xl md:text-2xl">2</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Auto-Categorize with AI</h3>
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Auto-Categorize with AI</h3>
              <p className="text-gray-600 text-center mb-4">Click the Expense Sorted add-on. Our AI categorizes all transactions in seconds.</p>
              <div className="mt-auto bg-gray-50 rounded-lg p-3 w-full h-[300px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/f-you-money-categorise-transactions.png"
                  width={614}
                  height={400}
                  alt="AI auto-categorizing expenses in Google Sheets"
                  className="w-full object-contain max-h-full"
                />
              </div>
              {/* Arrow for desktop - visible only on md+ screens */}
              <div className="hidden md:block absolute right-0 top-1/3 transform translate-x-1/2 z-10">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807612 27.9792 0.807612 27.3934 1.3934C26.8076 1.97918 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="#E2E8F0"/>
                </svg>
              </div>
            </div>

            {/* Step 3: Review */}
            <div className="flex flex-col items-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center mb-4 md:mb-6">
                <div className="bg-primary/10 rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold text-xl md:text-2xl">3</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold md:hidden">Review & Analyze</h3>
              </div>
              <h3 className="text-xl font-semibold mb-3 hidden md:block text-center">Review & Analyze</h3>
              <p className="text-gray-600 text-center mb-4">Review your categorized data and instantly see your spending summary in your sheet.</p>
              <div className="mt-auto bg-gray-50 rounded-lg p-3 w-full h-[300px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/f-you-money-analyse-transactions.png"
                  width={400}
                  height={300}
                  alt="Analyzing spending patterns in financial dashboard"
                  className="w-full object-contain max-h-full"
                />
              </div>
            </div>
          </div>

          {/* Time Saving Highlight */}
          <div className="max-w-lg mx-auto mt-10 md:mt-12 text-center py-4">
            <div className="inline-block bg-green-50 border border-green-100 text-green-700 font-semibold px-6 py-2 rounded-full text-sm mb-2">
              20 seconds instead of 20 minutes
            </div>
            <p className="text-gray-600 max-w-md mx-auto">No more tedious sorting – Expense Sorted handles it for you, every month.</p>
          </div>
        </div>

        {/* Benefits & Value Proposition Section */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose Expense Sorted Add-on
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Benefit 1: Save Hours Every Month */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md flex">
              <div className="mr-5 flex-shrink-0">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Save Hours Every Month</h3>
                <p className="text-gray-600">Automatic categorization replaces tedious manual tracking of expenses, freeing up hours each month for what truly matters.</p>
              </div>
            </div>
            
            {/* Benefit 2: Easy & Effortless */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md flex">
              <div className="mr-5 flex-shrink-0">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 3.5L13.5 21.5M4 8.5H10M4 16.5H10" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Easy & Effortless</h3>
                <p className="text-gray-600">No complex rules or formulas to maintain. Unlike rigid rule-based categorization, our AI adapts on its own to new transactions.</p>
              </div>
            </div>
            
            {/* Benefit 3: Customized to You */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md flex">
              <div className="mr-5 flex-shrink-0">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Customized to Your Spending</h3>
                <p className="text-gray-600">Train the AI on your data so it fits your unique spending patterns – your categories, your terms, your budget.</p>
              </div>
            </div>
            
            {/* Benefit 4: Privacy First */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md flex">
              <div className="mr-5 flex-shrink-0">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Privacy First</h3>
                <p className="text-gray-600">100% Privacy – your transactions stay in your Google Sheet. </p>
              </div>
            </div>
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
        </div>

        {/* Product Demo Video */}
        <div className="rounded-2xl overflow-hidden shadow-soft mb-16 bg-surface p-6">
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
        </div>

        {/* Core Benefits Section */}
        <div className="bg-surface rounded-2xl p-8 shadow-soft mb-16">
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
        </div>

        {/* Founder Message */}
        <div className="bg-surface rounded-2xl p-8 shadow-soft mb-16">
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
        </div>

        {/* Testimonials Section - Enhanced with faces and more details */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What Our Community Says</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-soft flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4 overflow-hidden">
                <Image
                  src="/testimonial-alex.jpg"
                  width={64}
                  height={64}
                  alt="Alex M."
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "It changed how I look at my finances forever. Now I know exactly where my money goes."
              </p>
              <p className="font-semibold">— Alex M.</p>
              <p className="text-sm text-gray-500">Software Engineer</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-soft flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4 overflow-hidden">
                <Image
                  src="/testimonial-sarah.jpg"
                  width={64}
                  height={64}
                  alt="Sarah K."
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "I now know exactly how long my savings will last, giving me peace of mind to make career changes."
              </p>
              <p className="font-semibold">— Sarah K.</p>
              <p className="text-sm text-gray-500">Marketing Consultant</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-soft flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4 overflow-hidden">
                <Image
                  src="/testimonial-liam.jpg"
                  width={64}
                  height={64}
                  alt="Liam R."
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-600 mb-4 text-center">
                "No more guessing. Financial freedom feels achievable now that I have a clear roadmap."
              </p>
              <p className="font-semibold">— Liam R.</p>
              <p className="text-sm text-gray-500">Small Business Owner</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-surface rounded-2xl p-8 shadow-soft mb-16">
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
        </div>

        {/* References Section */}
        <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl p-8">
          <References />
        </div>
      </main>
    </div>
  );
}
