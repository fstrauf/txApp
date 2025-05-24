import { useState, useEffect } from "react";
import { Input } from "@headlessui/react";

// Helper function to format number with thousand separators
const formatNumberWithCommas = (value: number | string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };
  
  // Helper function to parse formatted number string to a plain number string or empty
  const parseFormattedNumberString = (value: string): string => {
    return value.replace(/,/g, '');
  };
  
  // Currency Input Component - FIXED to match artifact exactly
  export interface CurrencyInputProps {
    value: number | string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    label?: string;
    helperText?: string;
    className?: string;
  }

  export const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
    value, 
    onChange, 
    placeholder = "5,000", 
    label, 
    helperText,
    className = ""
  }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
  
    useEffect(() => {
      setDisplayValue(formatNumberWithCommas(value));
    }, [value]);
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numericString = parseFormattedNumberString(rawValue);
  
      // Allow only numbers and at most one decimal point
      if (/^\d*\.?\d*$/.test(numericString) || numericString === '') {
        setDisplayValue(formatNumberWithCommas(numericString));
  
        // Create a synthetic event for the parent onChange
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: numericString,
          },
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };
  
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-2xl font-semibold text-gray-800 mb-2">
            {label}
          </label>
        )}
        {helperText && (
          <p className="text-lg text-gray-500 mb-5">
            {helperText}
          </p>
        )}
        <div className="relative group">
          
          {/* Background gradient effect on focus */}
          <div className={`
            absolute inset-0 rounded-xl transition-all duration-300
            ${isFocused ? 'bg-linear-to-r from-indigo-50/50 to-purple-50/50' : ''}
          `} />
          
          <Input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              relative w-full pl-12 pr-6 py-4 px-4
              border-2 rounded-xl text-2xl font-semibold
              transition-all duration-300 ease-out
              placeholder-gray-400 bg-white/90 backdrop-blur-sm
              
              /* Border and shadow transitions */
              ${isFocused 
                ? 'border-indigo-500 shadow-lg shadow-indigo-100 transform scale-[1.02]' 
                : 'border-gray-200 hover:border-gray-300 shadow-sm'
              }
              
              /* Focus styles */
              focus:outline-none focus:ring-4 focus:ring-indigo-100
              
              /* Smooth text rendering */
              antialiased
              
              /* Custom selection color */
              selection:bg-indigo-200 selection:text-indigo-900
            `}
            style={{
              // Smooth number transitions
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              // Ensure proper text indentation for the dollar sign
              textIndent: '1.5rem',
            }}
          />
          
          {/* Optional: Add a subtle shine effect on hover */}
          <div className={`
            absolute inset-0 rounded-xl pointer-events-none
            bg-linear-to-r from-transparent via-white/10 to-transparent
            transform -translate-x-full group-hover:translate-x-full
            transition-transform duration-1000 ease-out
          `} />
        </div>
        
        {/* Optional: Add a subtle helper text with animation */}
        {displayValue && (
          <div className="mt-2 text-sm text-gray-500 animate-fade-in">
            {parseFloat(parseFormattedNumberString(displayValue)) >= 10000 && 
              `Nice! That's ${formatNumberWithCommas(displayValue)} dollars`
            }
          </div>
        )}
      </div>
    );
  };