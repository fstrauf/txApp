'use client';

import React, { useState } from 'react';
import { 
  XMarkIcon,
  SparklesIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import SheetDownloadPopup from '@/app/components/shared/SheetDownloadPopup';
import posthog from 'posthog-js';
import { useSession } from 'next-auth/react';

interface FinancialSnapshotOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSnapshot: () => void;
  onGetFreeSheet: () => void;
}

export const FinancialSnapshotOfferModal: React.FC<FinancialSnapshotOfferModalProps> = ({
  isOpen,
  onClose,
  onPurchaseSnapshot,
  onGetFreeSheet
}) => {
  const { data: session } = useSession();
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  if (!isOpen) return null;

  const handleFreeSheetClick = () => {
    posthog.capture('free_spreadsheet_clicked', {
      source: 'snapshot_offer_modal',
      user_authenticated: !!session?.user?.id
    });
    setShowEmailCapture(true);
  };

  const handleSnapshotClick = () => {
    posthog.capture('financial_snapshot_purchase_clicked', {
      source: 'snapshot_offer_modal',
      user_authenticated: !!session?.user?.id
    });
    
    onPurchaseSnapshot();
  };

  const handleEmailCaptureComplete = () => {
    setShowEmailCapture(false);
    onGetFreeSheet();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-primary/60 hover:text-primary transition-colors z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {!showEmailCapture ? (
            <>
              {/* Main Offer Screen */}
              <div className="p-8 lg:p-12">
                <div className="text-center mb-10">
                  {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                    <span className="text-base font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Choose Your Path to Financial Clarity
                    </span>
                  </div> */}
                  
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    Get Your Complete Clarity
                  </h2>
                </div>

                {/* Value Proposition Comparison */}
                <div className="grid lg:grid-cols-2 gap-8 mb-6">
                  {/* Free Option */}
                  <div className="p-8 bg-primary/5 rounded-2xl border-2 border-primary/20 relative">
                    <div className="text-center mb-6">
                      {/* <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DocumentTextIcon className="w-8 h-8 text-primary" />
                      </div> */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        DIY Spreadsheet
                      </h3>
                      <p className="text-3xl font-bold text-gray-900">FREE</p>
                    </div>
                    
                    <ul className="space-y-4 text-base text-gray-600 mb-8">
                      <li className="flex items-start gap-3">
                        <span className="text-primary/60 mt-1">•</span>
                        <span>Manual data import and entry</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary/60 mt-1">•</span>
                        <span>Basic expense categories</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary/60 mt-1">•</span>
                        <span>Google Sheets analysis and insights</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary/60 mt-1">•</span>
                        <span>~3-6 hours of manual work</span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={handleFreeSheetClick}
                      className="w-full px-6 py-4 bg-white border-2 border-primary/30 text-primary rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all font-semibold text-lg"
                    >
                      Get Free Spreadsheet
                    </button>
                    
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Just enter your email
                    </p>
                  </div>

                  {/* Premium Option */}
                  <div className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border-2 border-secondary/30 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-secondary to-primary text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                    
                    <div className="text-center mb-6 mt-4">
                      {/* <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChartBarIcon className="w-8 h-8 text-secondary" />
                      </div> */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Financial Snapshot
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-3xl font-bold text-gray-900">$49</p>
                        <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">one-time</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-4 text-base text-gray-700 mb-8">
                      <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Upload up to 24 months</strong> of bank data</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>AI categorizes</strong> every transaction</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Find hidden money leaks</strong> instantly</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Personalized insights</strong></span>
                      </li>
                    <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>30 min micro course</strong> included</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Done in 2 minutes</strong> (not 3-6 hours)</span>
                      </li>
                    <li className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>3 monthly updates</strong> add new data for for three months</span>
                      </li>
                    </ul>
                    
                    <button
                      onClick={handleSnapshotClick}
                      className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
                    >
                      Get My Financial Snapshot
                    </button>
                    
                    <p className="text-sm text-gray-600 text-center mt-3">
                      30-day money-back guarantee
                    </p>
                  </div>
                </div>

                {/* Social Proof & Trust Signals */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <ClockIcon className="w-6 h-6 text-secondary" />
                      <span className="font-semibold text-gray-900">Real Results This Week:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <p>💡 "Found $180/month in forgotten subscriptions" - Sarah M.</p>
                      <p>📈 "Realized I had 18 months runway, not 6!" - David K.</p>
                      <p>🎯 "Finally understand where my money goes" - Lisa R.</p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-600 font-medium">
                    Join <span className="text-secondary font-bold">2,847 people</span> who discovered their financial leaks this week
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8">
              <SheetDownloadPopup
                isOpen={true}
                setIsOpen={(open: boolean) => {
                  if (!open) {
                    handleEmailCaptureComplete();
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
