'use client';

import React, { useState } from 'react';
import { Download, Zap } from 'lucide-react';
import posthog from 'posthog-js';
import SheetDownloadPopup from '@/app/components/shared/SheetDownloadPopup';

interface FreeSheetCTAProps {
  onSuperchargeClick: () => void;
}

export const FreeSheetCTA: React.FC<FreeSheetCTAProps> = ({ onSuperchargeClick }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleFreeSheetClick = () => {
    posthog.capture('pf_free_sheet_download_clicked');
    setIsPopupOpen(true);
  };

  const handleSuperchargeClick = () => {
    posthog.capture('pf_supercharge_cta_clicked');
    onSuperchargeClick();
  };

  return (
    <div className="max-w-3xl mx-auto mb-16 text-center mt-10">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        Prefer to DIY? Grab the Free Spreadsheet
      </h3>
      <p className="text-lg text-gray-700 mb-6">
        Download the same Google Sheets template our tool uses under the hood. No signup required.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* Free Sheet Button */}
        <button
          onClick={handleFreeSheetClick}
          className="inline-flex items-center justify-center px-6 py-4 rounded-lg border-2 border-primary text-primary bg-white font-semibold hover:bg-primary/10 transition-all duration-200"
        >
          <Download className="w-5 h-5 mr-2" />
          Get the Free Sheet
        </button>

        {/* Divider */}
        <div className="hidden sm:flex items-center text-gray-500 font-semibold">or</div>

        {/* Supercharge Button */}
        <button
          onClick={handleSuperchargeClick}
          className="inline-flex items-center justify-center px-6 py-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all duration-200"
        >
          <Zap className="w-5 h-5 mr-2" />
          Supercharge with Expense Sorted
        </button>
      </div>

      {/* Email capture popup */}
      <SheetDownloadPopup
        isOpen={isPopupOpen}
        setIsOpen={setIsPopupOpen}
        /* Pass templateSpreadsheetId if needed */
      />
    </div>
  );
}; 