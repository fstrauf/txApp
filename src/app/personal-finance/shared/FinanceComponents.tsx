// src/app/personal-finance/shared/FinanceComponents.tsx
import React, { useState, useEffect } from 'react';
import { Input, Button } from '@headlessui/react';





// Quick Amount Selection Component - FIXED spacing and responsive
export interface QuickAmountSelectorProps {
  amounts?: number[];
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  className?: string;
}

export const QuickAmountSelector: React.FC<QuickAmountSelectorProps> = ({ 
  amounts = [3000, 4500, 6000, 7500, 9000, 12000], 
  selectedAmount, 
  onSelect,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 ${className}`}>
      {amounts.map((amount) => (
        <Button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
          className={`px-4 py-4 border border-gray-200 rounded-xl text-center cursor-pointer 
                     transition-all duration-200 font-medium text-base
                     hover:border-primary hover:bg-primary-50 hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20
                     ${selectedAmount === amount 
                       ? 'bg-primary text-white border-primary shadow-md' 
                       : 'bg-white text-gray-700'
                     }`}
        >
          ${amount >= 1000 ? `${Math.floor(amount/1000)}k` : amount.toLocaleString()}
          {amount >= 12000 && '+'}
        </Button>
      ))}
    </div>
  );
};

// Primary Button Component - FIXED to match artifact styling
export type PrimaryButtonVariant = "primary" | "secondary" | "success";

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary",
  className = "" 
}) => {
  const baseClasses = "px-8 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-20";
  
  const variants: Record<PrimaryButtonVariant, string> = {
    primary: `${baseClasses} bg-gradient-to-r from-primary to-secondary text-white 
              hover:from-secondary hover:to-primary hover:transform hover:-translate-y-0.5 hover:shadow-lg
              focus:ring-primary disabled:opacity-10 disabled:cursor-not-allowed disabled:transform-none disabled:hover:from-primary disabled:hover:to-secondary`,
    secondary: `${baseClasses} bg-gray-100 text-gray-700 border-2 border-gray-200
                hover:bg-gray-200 hover:border-gray-300 focus:ring-gray-400`,
    success: `${baseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white
              hover:from-green-600 hover:to-green-700 hover:transform hover:-translate-y-0.5 hover:shadow-lg focus:ring-green-500`
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Parameter Display Card Component - FIXED styling
export interface ParameterCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  className?: string;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({ 
  label, 
  value, 
  subtext, 
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm ${className}`}>
      <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
      </div>
      {subtext && (
        <div className="text-xs text-gray-400">
          {subtext}
        </div>
      )}
    </div>
  );
};

// Parameters Review Section Component - FIXED layout and colors
export interface ParametersReviewProps {
  income: number;
  spending: number;
  savings: number;
  onEdit: () => void;
  className?: string;
}

export const ParametersReview: React.FC<ParametersReviewProps> = ({ 
  income, 
  spending, 
  savings, 
  onEdit,
  className = "" 
}) => {
  const monthlySavings = income - spending;
  const savingsRate = income > 0 ? ((monthlySavings) / income) * 100 : 0;
  const monthsOfExpenses = spending > 0 ? savings / spending : 0;

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600';
    if (rate >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRunwayColor = (months: number) => {
    if (months >= 6) return 'text-green-600';
    if (months >= 3) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-white rounded-2xl p-8 mb-8 border border-gray-200 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          📊 Your Financial Snapshot
        </h3>
        <button
          onClick={onEdit}
          className="px-4 py-2 border-2 border-indigo-500 text-indigo-600 rounded-lg text-sm font-medium
                   hover:bg-indigo-500 hover:text-white transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
        >
          Edit Numbers
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ParameterCard 
          label="Monthly Income" 
          value={income} 
          subtext="Take-home pay" 
        />
        <ParameterCard 
          label="Monthly Spending" 
          value={spending} 
          subtext="Total expenses" 
        />
        <ParameterCard 
          label="Current Savings" 
          value={savings} 
          subtext="Emergency fund" 
        />
      </div>
      
      <div className="pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Monthly Cash Flow</div>
            <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {monthlySavings >= 0 ? '+' : ''}${monthlySavings.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Savings Rate</div>
            <div className={`text-2xl font-bold ${getSavingsRateColor(savingsRate)}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Emergency Runway</div>
            <div className={`text-2xl font-bold ${getRunwayColor(monthsOfExpenses)}`}>
              {monthsOfExpenses.toFixed(1)} months
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Insight Card Component - FIXED gradients and spacing
export interface InsightCardProps {
  type?: "default" | "warning" | "success" | "optimize";
  icon?: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
  benchmark?: React.ReactNode;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ 
  type = "default", 
  icon, 
  title, 
  text, 
  action, 
  benchmark,
  className = "" 
}) => {
  const typeStyles: Record<InsightCardProps['type'] & string, string> = {
    warning: "bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500",
    success: "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500", 
    optimize: "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500"
  };

  return (
    <div className={`rounded-2xl p-6 mb-5 shadow-sm ${typeStyles[type || 'default']} ${className}`}>
      {icon && <div className="text-3xl mb-4">{icon}</div>}
      <h4 className="text-xl font-bold text-gray-800 mb-3">{title}</h4>
      <p className="text-base text-gray-600 mb-4 leading-relaxed">{text}</p>
      {action && (
        <div className="bg-white bg-opacity-70 rounded-xl p-4 mt-4">
          <div className="text-sm font-semibold text-gray-800">{action}</div>
        </div>
      )}
      {benchmark && (
        <div className="text-xs text-gray-500 italic mt-3">{benchmark}</div>
      )}
    </div>
  );
};

// Dive Deeper Card Component - FIXED hover effects and layout
export interface DiveDeeperCardProps {
  type?: "default" | "spending" | "savings" | "goals";
  icon?: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
  actionText?: string;
  onClick?: () => void;
  className?: string;
}

export const DiveDeeperCard: React.FC<DiveDeeperCardProps> = ({ 
  type = "default", 
  icon, 
  title, 
  description, 
  features = [], 
  actionText,
  onClick,
  className = "" 
}) => {
  const typeStyles: Record<DiveDeeperCardProps['type'] & string, string> = {
    spending: "bg-gradient-to-r from-red-50 to-pink-50 hover:border-red-400 hover:shadow-red-100",
    savings: "bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-green-100",
    goals: "bg-gradient-to-r from-orange-50 to-yellow-50 hover:border-orange-400 hover:shadow-orange-100",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-400 hover:shadow-indigo-100"
  };

  return (
    <div 
      onClick={onClick}
      className={`${typeStyles[type || 'default']} rounded-2xl p-6 text-center cursor-pointer 
                 transition-all duration-300 border-2 border-transparent shadow-sm
                 hover:transform hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-opacity-20
                 ${type === 'spending' ? 'focus:ring-red-500' : 
                   type === 'savings' ? 'focus:ring-green-500' : 
                   type === 'goals' ? 'focus:ring-orange-500' : 'focus:ring-indigo-500'} ${className}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>
      
      {features.length > 0 && (
        <div className="text-left mb-4">
          <ul className="text-xs text-gray-500 space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {actionText && (
        <div className="bg-white bg-opacity-80 rounded-xl p-3 mt-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-800">{actionText}</div>
        </div>
      )}
    </div>
  );
};

// CSV Upload Area Component - FIXED drag and drop styling
export interface CSVUploadAreaProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export const CSVUploadArea: React.FC<CSVUploadAreaProps> = ({ 
  onFileSelect, 
  className = "" 
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && (files[0].type === 'text/csv' || files[0].name.endsWith('.csv'))) {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`text-center my-10 ${className}`}>
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300
                   ${isDragOver 
                     ? 'border-green-500 bg-green-50' 
                     : 'border-indigo-400 bg-indigo-50 hover:border-purple-500 hover:bg-indigo-100'}`}
        onClick={() => document.getElementById('csvFileInput')?.click()}
      >
        <div className={`text-7xl mb-6 ${isDragOver ? 'text-green-500' : 'text-indigo-500'}`}>📄</div>
        <h3 className="text-3xl font-bold text-gray-800 mb-3">Drop your CSV file here</h3>
        <p className="text-lg text-gray-600 mb-6">or click to browse</p>
        <p className="text-sm text-gray-500 mb-8">Supports CSV files from all major NZ banks</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {['ANZ', 'ASB', 'Westpac', 'BNZ'].map((bank) => (
            <div key={bank} className="bg-white rounded-xl p-4 text-sm text-gray-600 border border-gray-200 shadow-sm">
              <div className="font-semibold text-gray-800">{bank}</div>
              <div className="text-xs">Export → CSV</div>
            </div>
          ))}
        </div>
      </div>
      
      <input 
        type="file" 
        id="csvFileInput" 
        accept=".csv" 
        className="hidden" 
        onChange={handleFileInputChange}
      />
      
      <div className="mt-6 p-5 bg-green-50 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center">
          <span className="text-xl mr-3">🔒</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">Your data stays private</div>
            <div className="text-xs text-gray-600">All analysis happens in your browser. No data is sent to our servers.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component - FIXED to match artifact
export interface ProgressBarProps {
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep = 1, 
  totalSteps = 7, 
  className = "" 
}) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className={`w-full h-1 bg-gray-200 ${className}`}>
      <div 
        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};