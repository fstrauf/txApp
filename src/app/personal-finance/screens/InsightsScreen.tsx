'use client';

import React from 'react';
import { 
  ParametersReview,
  InsightCard,
  DiveDeeperCard
} from '@/app/personal-finance/components/FinanceComponents';
// import { usePersonalFinanceStore } from '@/store/personalFinanceStore'; // For navigation if added

const InsightsScreen: React.FC = () => {
  // const { nextScreen, prevScreen } = usePersonalFinanceStore(); // If adding navigation
  
  const userData = { income: 5000, spending: 3800, savings: 15000 };
  
  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 min-h-[700px] bg-white"> {/* Ensure white background and padding */}
      <ParametersReview
        income={userData.income}
        spending={userData.spending}
        savings={userData.savings}
        onEdit={() => console.log('Edit parameters: Navigating to relevant screen or opening modal...')}
        className="mb-8" // Added margin for spacing
      />
      
      <InsightCard
        type="success"
        icon="🎉"
        title="Great savings habit!"
        text="Your 24% savings rate puts you in the top 10% of Kiwis your age."
        action="Keep it up! Consider increasing by 2-3% if possible."
        benchmark="At current rate: $14,400/year"
        className="mb-8" // Added margin for spacing
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8"> {/* Responsive grid */}
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
          onClick={() => console.log('Go to spending analysis page/modal...')}
          // className="md:col-span-1" // Adjust column span if needed for layout
        />
        {/* Placeholder for other DiveDeeperCards if the layout is 3 columns */}
        {/* 
        <DiveDeeperCard title="Card 2" description="Desc 2" icon="📈" type="savings" className="md:col-span-1" />
        <DiveDeeperCard title="Card 3" description="Desc 3" icon="🎯" type="goals" className="md:col-span-1" /> 
        */}
      </div>

      {/* 
      // Example of adding Back/Continue buttons if desired later:
      // import { PrimaryButton } from '@/app/personal-finance/components/FinanceComponents'; // Import if using
      <div className="flex flex-col sm:flex-row justify-between mt-12 space-y-4 sm:space-y-0 sm:space-x-4">
        <PrimaryButton onClick={prevScreen} variant="secondary" className="w-full sm:w-auto flex-grow">
          Back
        </PrimaryButton>
        <PrimaryButton onClick={nextScreen} className="w-full sm:w-auto flex-grow">
          Finish & See Dashboard (Example)
        </PrimaryButton>
      </div>
      */}
    </div>
  );
};

export default InsightsScreen;
