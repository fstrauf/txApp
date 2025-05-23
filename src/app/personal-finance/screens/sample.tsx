import React, { useState } from 'react';

// Currency Input Component
const CurrencyInput = ({ 
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
const QuickAmountSelector = ({ 
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
const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary",
  className = "" 
}) => {
  const baseClasses = "w-full px-6 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200";
  
  const variants = {
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
const ParameterCard = ({ 
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
const ParametersReview = ({ 
  income, 
  spending, 
  savings, 
  onEdit,
  className = "" 
}) => {
  const monthlySavings = income - spending;
  const savingsRate = income > 0 ? ((monthlySavings) / income) * 100 : 0;
  const monthsOfExpenses = spending > 0 ? savings / spending : 0;

  const getSavingsRateColor = (rate) => {
    if (rate >= 15) return 'text-green-600';
    if (rate >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRunwayColor = (months) => {
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
const InsightCard = ({ 
  type = "default", 
  icon, 
  title, 
  text, 
  action, 
  benchmark,
  className = "" 
}) => {
  const typeStyles = {
    warning: "bg-gradient-to-r from-red-50 to-pink-50 border-l-red-500",
    success: "bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-500", 
    optimize: "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-orange-500",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-indigo-500"
  };

  return (
    <div className={`rounded-2xl p-6 mb-5 border-l-4 ${typeStyles[type]} ${className}`}>
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
const DiveDeeperCard = ({ 
  type = "default", 
  icon, 
  title, 
  description, 
  features = [], 
  actionText,
  onClick,
  className = "" 
}) => {
  const typeStyles = {
    spending: "bg-gradient-to-r from-red-50 to-pink-50 hover:border-red-500 hover:shadow-red-100",
    savings: "bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-500 hover:shadow-green-100",
    goals: "bg-gradient-to-r from-orange-50 to-yellow-50 hover:border-orange-500 hover:shadow-orange-100",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-500 hover:shadow-indigo-100"
  };

  return (
    <div 
      onClick={onClick}
      className={`${typeStyles[type]} rounded-2xl p-6 text-center cursor-pointer 
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

// Demo Component showing all components in action
const FinanceComponentsDemo = () => {
  const [income, setIncome] = useState(5000);
  const [spending, setSpending] = useState(3800);
  const [savings, setSavings] = useState(15000);
  const [selectedAmount, setSelectedAmount] = useState(null);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          NZ Personal Finance App Components
        </h1>
        
        {/* Currency Input Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Currency Input Component</h2>
          <CurrencyInput
            label="What's your monthly take-home income?"
            helperText="After tax, KiwiSaver, and student loan payments"
            value={income}
            onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
            placeholder="4,500"
          />
          
          <QuickAmountSelector
            amounts={[3000, 4500, 6000, 7500, 9000, 12000]}
            selectedAmount={selectedAmount}
            onSelect={(amount) => {
              setSelectedAmount(amount);
              setIncome(amount);
            }}
          />
        </div>

        {/* Parameters Review Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Parameters Review Component</h2>
          <ParametersReview
            income={income}
            spending={spending}
            savings={savings}
            onEdit={() => alert('Edit parameters clicked!')}
          />
        </div>

        {/* Insight Cards Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Insight Cards</h2>
          <div className="space-y-4">
            <InsightCard
              type="success"
              icon="🎉"
              title="Great savings habit!"
              text="Your 24% savings rate puts you in the top 10% of Kiwis your age."
              action="Keep it up! Consider increasing by 2-3% if possible."
              benchmark="At current rate: $14,400/year"
            />
            
            <InsightCard
              type="warning"
              icon="⚠️"
              title="Build your emergency fund"
              text="Your savings would last 3.9 months if income stopped."
              action="Build emergency fund to $11,400 (3 months expenses) before other goals."
              benchmark="Timeline: 8 months at current rate"
            />
            
            <InsightCard
              type="optimize"
              icon="💡"
              title="Boost Your Everyday Savings Rate"
              text="Your $15,000 in everyday savings could earn more with a high-interest account."
              action="Switch to a 4% savings account = extra $50/month ($600/year)"
              benchmark="Best NZ savings rates: Heartland Bank 4.1%, Rabobank 4.0%"
            />
          </div>
        </div>

        {/* Dive Deeper Cards Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Dive Deeper Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DiveDeeperCard
              type="spending"
              icon="💳"
              title="Breakdown Your Expenses"
              description="Upload bank transactions and discover where your money goes"
              features={[
                "Automatic categorization",
                "Spending trends over time",
                "Compare to benchmarks",
                "Find saving opportunities"
              ]}
              actionText="Upload CSV from your bank →"
              onClick={() => alert('Going to spending analysis!')}
            />
            
            <DiveDeeperCard
              type="savings"
              icon="🏦"
              title="Optimize Your Savings"
              description="Analyze where you keep your money and maximize returns"
              features={[
                "Savings account analysis",
                "Interest rate comparison",
                "Investment opportunities",
                "Emergency fund strategy"
              ]}
              actionText="Analyze your savings →"
              onClick={() => alert('Going to savings analysis!')}
            />
            
            <DiveDeeperCard
              type="goals"
              icon="🎯"
              title="Plan Your Goals"
              description="Set specific targets and get a roadmap to achieve them"
              features={[
                "Custom goal timelines",
                "Monthly savings targets",
                "Progress tracking",
                "Milestone celebrations"
              ]}
              actionText="Set your goals →"
              onClick={() => alert('Going to goal planning!')}
            />
          </div>
        </div>

        {/* Buttons Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Button Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PrimaryButton onClick={() => alert('Primary button clicked!')}>
              Continue
            </PrimaryButton>
            <PrimaryButton 
              variant="secondary" 
              onClick={() => alert('Secondary button clicked!')}
            >
              Back
            </PrimaryButton>
            <PrimaryButton 
              variant="success" 
              onClick={() => alert('Success button clicked!')}
            >
              Complete
            </PrimaryButton>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Test the Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Income</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Spending</label>
              <input
                type="number"
                value={spending}
                onChange={(e) => setSpending(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Savings</label>
              <input
                type="number"
                value={savings}
                onChange={(e) => setSavings(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceComponentsDemo;