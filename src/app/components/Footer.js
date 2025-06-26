// components/Footer.js

import Link from "next/link";
import InternalLinks from "@/components/InternalLinks";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="mb-8">
          <InternalLinks variant="footer" />
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-primary transition-colors text-sm py-3 px-4 min-h-[44px] flex items-center"
              >
                Pricing
              </Link>
              <Link 
                href="/privacy-policy" 
                className="text-gray-600 hover:text-primary transition-colors text-sm py-3 px-4 min-h-[44px] flex items-center"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/support" 
                className="text-gray-600 hover:text-primary transition-colors text-sm py-3 px-4 min-h-[44px] flex items-center"
              >
                Support
              </Link>
              <Link 
                href="/terms-of-service" 
                className="text-gray-600 hover:text-primary transition-colors text-sm py-3 px-4 min-h-[44px] flex items-center"
              >
                Terms of Service
              </Link>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-primary transition-colors text-sm py-3 px-4 min-h-[44px] flex items-center"
              >
                About
              </Link>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Expense Sorted. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
