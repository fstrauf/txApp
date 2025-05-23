import React from 'react';

// Currency Input Component
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
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xl font-semibold text-gray-800 mb-2">
          {label}
        </label>
      )}
      {helperText && (
        <p className="text-base text-gray-500 mb-5">
          {helperText}
        </p>
      )}
      <div className="relative">
        <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-600 text-2xl font-semibold">
          $
        </span>
        <input
          type="number"
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-6 py-5 border-2 border-gray-200 rounded-xl text-2xl font-semibold 
                   focus:outline-none focus:border-indigo-500 transition-colors duration-300
                   placeholder-gray-400"
        />
      </div>
    </div>
  );
};

// Quick Amount Selection Component
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
    <div className={`grid grid-cols-3 md:grid-cols-6 gap-3 mt-5 ${className}`}>
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => onSelect(amount)}
          className={`px-4 py-4 border border-gray-200 rounded-lg text-center cursor-pointer 
                     transition-all duration-200 font-medium text-base
                     hover:border-indigo-500 hover:bg-indigo-50
                     ${selectedAmount === amount 
                       ? 'bg-indigo-500 text-white border-indigo-500' 
                       : 'bg-white text-gray-700'
                     }`}
        >
          ${amount >= 1000 ? `${Math.floor(amount/1000)}k` : amount}
          {amount >= 12000 && '+'}
        </button>
      ))}
    </div>
  );
};

// Primary Button Component
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
  const baseClasses = "w-full px-6 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200";
  
  const variants: Record<PrimaryButtonVariant, string> = {
    primary: `${baseClasses} bg-gradient-to-r from-indigo-500 to-purple-600 text-white 
              hover:transform hover:-translate-y-0.5 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`,
    secondary: `${baseClasses} bg-gray-100 text-gray-600 border border-gray-200
                hover:bg-gray-200`,
    success: `${baseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white
              hover:transform hover:-translate-y-0.5 hover:shadow-lg`
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

// Parameter Display Card Component
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
    <div className={`bg-white rounded-xl p-5 text-center border border-gray-200 ${className}`}>
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

// Parameters Review Section Component
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
    <div className={`bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          📊 Your Financial Snapshot
        </h3>
        <button
          onClick={onEdit}
          className="px-4 py-2 border border-indigo-500 text-indigo-500 rounded-md text-sm 
                   hover:bg-indigo-500 hover:text-white transition-colors duration-200"
        >
          Edit Numbers
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
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
      
      <div className="pt-5 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
          <div>
            <div className="text-sm text-gray-500 mb-1">Monthly Cash Flow</div>
            <div className={`text-xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {monthlySavings >= 0 ? '+' : ''}${monthlySavings.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Savings Rate</div>
            <div className={`text-xl font-bold ${getSavingsRateColor(savingsRate)}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Emergency Runway</div>
            <div className={`text-xl font-bold ${getRunwayColor(monthsOfExpenses)}`}>
              {monthsOfExpenses.toFixed(1)} months
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Insight Card Component
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
    warning: "bg-gradient-to-r from-red-50 to-pink-50 border-l-red-500",
    success: "bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-500", 
    optimize: "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-orange-500",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-indigo-500"
  };

  return (
    <div className={`rounded-2xl p-6 mb-5 border-l-4 ${typeStyles[type || 'default']} ${className}`}>
      {icon && <div className="text-2xl mb-3">{icon}</div>}
      <h4 className="text-lg font-bold text-gray-800 mb-2">{title}</h4>
      <p className="text-base text-gray-600 mb-3 leading-relaxed">{text}</p>
      {action && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3 mt-3">
          <div className="text-sm font-semibold text-gray-800">{action}</div>
        </div>
      )}
      {benchmark && (
        <div className="text-xs text-gray-500 italic mt-2">{benchmark}</div>
      )}
    </div>
  );
};

// Dive Deeper Card Component
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
    spending: "bg-gradient-to-r from-red-50 to-pink-50 hover:border-red-500 hover:shadow-red-100",
    savings: "bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-500 hover:shadow-green-100",
    goals: "bg-gradient-to-r from-orange-50 to-yellow-50 hover:border-orange-500 hover:shadow-orange-100",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-500 hover:shadow-indigo-100"
  };

  return (
    <div 
      onClick={onClick}
      className={`${typeStyles[type || 'default']} rounded-2xl p-6 text-center cursor-pointer 
                 transition-all duration-300 border-2 border-transparent
                 hover:transform hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>
      
      {features.length > 0 && (
        <div className="text-left mb-4">
          <ul className="text-xs text-gray-500 space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {actionText && (
        <div className="bg-white bg-opacity-80 rounded-lg p-3 mt-4">
          <div className="text-sm font-semibold text-gray-800">{actionText}</div>
        </div>
      )}
    </div>
  );
};

// Upload Area Component (for CSV uploads)
export interface CSVUploadAreaProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export const CSVUploadArea: React.FC<CSVUploadAreaProps> = ({ 
  onFileSelect, 
  className = "" 
}) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={`text-center my-10 ${className}`}>
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-indigo-500 rounded-2xl p-10 
                   bg-indigo-50 cursor-pointer transition-all duration-300
                   hover:border-purple-600 hover:bg-indigo-100"
        onClick={() => document.getElementById('csvFileInput')?.click()}
      >
        <div className="text-6xl mb-4 text-indigo-500">📄</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Drop your CSV file here</h3>
        <p className="text-base text-gray-600 mb-5">or click to browse</p>
        <p className="text-sm text-gray-500 mb-5">Supports CSV files from all major NZ banks</p>
        
        <div className="grid grid-cols-4 gap-3 mt-5">
          {['ANZ', 'ASB', 'Westpac', 'BNZ'].map((bank) => (
            <div key={bank} className="bg-white rounded-lg p-3 text-xs text-gray-600 border border-gray-200">
              <div className="font-semibold">{bank}</div>
              <div>Export → CSV</div>
            </div>
          ))}
        </div>
      </div>
      
      <input 
        type="file" 
        id="csvFileInput" 
        accept=".csv" 
        style={{ display: 'none' }} 
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
      />
      
      <div className="mt-5 p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center">
          <span className="text-lg mr-2">🔒</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">Your data stays private</div>
            <div className="text-xs text-gray-600">All analysis happens in your browser. No data is sent to our servers.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
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
        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};