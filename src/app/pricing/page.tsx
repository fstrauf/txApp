"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState<{silver: boolean, gold: boolean}>({ silver: false, gold: false });
  const { data: session } = useSession();
  const router = useRouter();
  
  // Pricing calculation with 20% discount for annual plans
  const silverMonthly = 2;
  const goldMonthly = 10;
  const silverAnnual = silverMonthly * 12 * 0.8;
  const goldAnnual = goldMonthly * 12 * 0.8;

  // Function to handle subscription
  const handleSubscribe = async (plan: string) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/pricing`);
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: true }));
      
      // Call the checkout API
      const response = await fetch(`/api/stripe/checkout?plan=${plan.toLowerCase()}&billing=${isAnnual ? "annual" : "monthly"}`);
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: false }));
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setIsLoading(prev => ({ ...prev, [plan.toLowerCase()]: false }));
    }
  };

  return (
    <div className="bg-background-default min-h-screen py-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Choose the plan that best fits your needs. Get started with a free trial, no credit card required.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center mt-8">
            <span className={`mr-3 text-sm ${!isAnnual ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-12 items-center rounded-full"
            >
              <span className={`${isAnnual ? 'bg-primary' : 'bg-gray-300'} flex h-6 w-12 items-center rounded-full p-1 transition-colors duration-300`}>
                <span className={`${isAnnual ? 'translate-x-6' : 'translate-x-0'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300`}></span>
              </span>
            </button>
            <span className={`ml-3 text-sm ${isAnnual ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              Annual <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Silver Plan */}
          <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Silver</h2>
              <p className="text-gray-600 mt-2">Perfect for personal budgeting</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${isAnnual ? (silverAnnual/12).toFixed(2) : silverMonthly}</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">Billed annually (${silverAnnual.toFixed(2)})</p>
              )}
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">20 AI categorizations per month</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Google Sheets integration</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Access to Financial Freedom Spreadsheet</span>
              </li>
            </ul>
            
            <button
              onClick={() => handleSubscribe('silver')}
              disabled={isLoading.silver}
              className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70"
            >
              {isLoading.silver ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : session ? "Subscribe Now" : "Sign in to Subscribe"}
            </button>
            
            <p className="text-sm text-center mt-4 text-gray-600">
              Start with a free trial, no credit card required
            </p>
          </div>
          
          {/* Gold Plan */}
          <div className="bg-white rounded-2xl shadow-soft p-8 border-2 border-primary/20 flex flex-col relative overflow-hidden">
            <div className="absolute top-3 right-2 translate-x-[30%] translate-y-[-10%] rotate-45">
              <div className="bg-primary text-white text-xs px-8 py-1 shadow-md">
                Popular
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Gold</h2>
              <p className="text-gray-600 mt-2">For serious budget management</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">${isAnnual ? (goldAnnual/12).toFixed(2) : goldMonthly}</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">Billed annually (${goldAnnual.toFixed(2)})</p>
              )}
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700"><strong>Unlimited</strong> AI categorizations</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Google Sheets integration</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Access to Financial Freedom Spreadsheet</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">Early access to new features</span>
              </li>
            </ul>
            
            <button
              onClick={() => handleSubscribe('gold')}
              disabled={isLoading.gold}
              className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all duration-200 shadow-soft hover:shadow-glow text-center disabled:opacity-70"
            >
              {isLoading.gold ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : session ? "Subscribe Now" : "Sign in to Subscribe"}
            </button>
            
            <p className="text-sm text-center mt-4 text-gray-600">
              Start with a free trial, no credit card required
            </p>
          </div>
        </div>
        
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">How does the free trial work?</h3>
            <p className="text-gray-700">When you sign up, you'll get 14 days to try out all Gold tier features without providing payment information. After the trial ends, you can choose a plan or continue with limited features.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-700">Yes, you can change your subscription at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change will take effect at the end of your current billing cycle.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6 mb-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happens if I exceed my monthly categorizations on the Silver plan?</h3>
            <p className="text-gray-700">If you reach your 20 categorization limit on the Silver plan, you'll need to wait until the next billing cycle or upgrade to Gold for unlimited categorizations.</p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need help choosing a plan? <Link href="/support" className="text-primary hover:underline">Contact our team</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 