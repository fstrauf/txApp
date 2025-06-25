"use client";
import { Box } from "@/components/ui/Box";
import { CheckCircle } from 'lucide-react';

interface PricingSectionProps {
  showTitle?: boolean;
  onJoinWaitlist?: () => void;
  className?: string;
}

export default function PricingSection({ 
  showTitle = true, 
  onJoinWaitlist,
  className = ""
}: PricingSectionProps) {
  
  const handleJoinWaitlist = () => {
    if (onJoinWaitlist) {
      onJoinWaitlist();
    } else {
      // Default behavior: scroll to email signup on course page
      const signupSection = document.getElementById('email-signup');
      if (signupSection) {
        signupSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // If no email signup section, go to course page
        window.location.href = '/course#email-signup';
      }
    }
  };

  return (
    <section className={`mb-20 ${className}`}>
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Early Bird Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Get lifetime access to the complete system
          </p>
        </div>
      )}

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
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Complete 4-week course</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">All templates & worksheets</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Automation tools</span>
            </li>
          </ul>
          <button 
            onClick={handleJoinWaitlist}
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
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Everything in Early Bird</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Priority email support</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Bonus: Investment calculator</span>
            </li>
          </ul>
          <button 
            onClick={handleJoinWaitlist}
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
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Everything in Regular</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">1-hour setup call with me</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-gray-700">Custom automation setup</span>
            </li>
          </ul>
          <button 
            onClick={handleJoinWaitlist}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Join Waitlist
          </button>
        </Box>
      </div>
    </section>
  );
} 