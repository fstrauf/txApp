"use client";

import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HelpTooltipProps {
  content: string;
}

export default function HelpTooltip({ content }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-2">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0} // Make it focusable
        className="cursor-help"
      >
        <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" aria-hidden="true" />
      </span>

      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10"
          role="tooltip"
        >
          {content}
          {/* Optional: Add a small triangle pointer */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
} 