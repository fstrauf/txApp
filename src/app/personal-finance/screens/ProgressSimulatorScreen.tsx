'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { Box } from '@/components/ui/Box';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { 
  SparklesIcon,
  TrophyIcon,
  ChartBarIcon,
  BanknotesIcon,
  HomeIcon,
  AcademicCapIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface MonthProjection {
  month: string;
  savings: number;
  spending: number;
  achievement: string | null;
  emergencyFundMonths: number;
  savingsRate: number;
}

const ProgressSimulatorScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'progressSimulator', 
    progress: getProgress() 
  });
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate realistic projections based on user's current data
  const generateProjections = (): MonthProjection[] => {
    const currentSavings = userData.savings || 0;
    const currentIncome = userData.income || 0;
    const currentSpending = userData.spending || 0;
    const monthlySavings = Math.max(currentIncome - currentSpending, 100); // Ensure positive savings

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const projections: MonthProjection[] = [];

    months.forEach((month, index) => {
      // Progressive improvement scenario
      const spendingReduction = index * 0.02; // 2% reduction per month
      const savingsIncrease = index * 0.03; // 3% savings increase per month
      
      const newSpending = currentSpending * (1 - spendingReduction);
      const newMonthlySavings = monthlySavings * (1 + savingsIncrease);
      const totalSavings = currentSavings + (newMonthlySavings * (index + 1));
      
      const emergencyFundMonths = newSpending > 0 ? totalSavings / newSpending : 0;
      const savingsRate = currentIncome > 0 ? (newMonthlySavings / currentIncome) * 100 : 0;

      let achievement: string | null = null;
      
      // Milestone achievements
      if (index === 0 && newMonthlySavings > monthlySavings) {
        achievement = 'First optimization wins!';
      } else if (index === 1 && newSpending < currentSpending * 0.95) {
        achievement = 'Spending down 5%+';
      } else if (index === 2 && emergencyFundMonths >= 1) {
        achievement = '1 month emergency fund!';
      } else if (index === 3 && savingsRate >= 15) {
        achievement = 'Savings rate: 15%+!';
      } else if (index === 4 && savingsRate >= 20) {
        achievement = 'Excellent savings rate: 20%!';
      } else if (index === 5) {
        achievement = 'On track for financial goals!';
      }

      projections.push({
        month,
        savings: Math.round(totalSavings),
        spending: Math.round(newSpending),
        achievement,
        emergencyFundMonths,
        savingsRate
      });
    });

    return projections;
  };

  const projections = generateProjections();

  // Auto-play animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      playAnimation();
    }, 1000); // Start animation after 1 second

    return () => clearTimeout(timer);
  }, []);

  const playAnimation = () => {
    setIsAnimating(true);
    trackAction('animation_started', {
      user_income: userData.income,
      user_spending: userData.spending,
      user_savings: userData.savings
    });
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      setSelectedMonth(currentIndex);
      currentIndex += 1;
      
      if (currentIndex >= projections.length) {
        clearInterval(interval);
        setIsAnimating(false);
        trackAction('animation_completed', {
          total_months_shown: projections.length,
          final_savings: projections[projections.length - 1].savings,
          final_spending: projections[projections.length - 1].spending
        });
      }
    }, 1000);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };

  const currentProjection = projections[selectedMonth];
  const improvement = selectedMonth > 0 ? {
    savingsGrowth: ((currentProjection.savings - projections[0].savings) / projections[0].savings * 100),
    spendingReduction: ((projections[0].spending - currentProjection.spending) / projections[0].spending * 100)
  } : null;

  return (
    <div className="min-h-screen bg-background-default">
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">

          {/* Header */}
          <Header 
            variant="gradient"
            size="xl"
            subtitle="See how Expense Sorted Pro could transform your financial future"
          >
            6-Month Progress Simulator
          </Header>



          {/* Main Simulator */}
          <Box variant="gradient" className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
                Your Financial Journey (with Pro)
              </h3>
              <p className="text-gray-600">
                Based on your current financial profile: ${userData.income?.toLocaleString()} income, 
                ${userData.spending?.toLocaleString()} spending, ${userData.savings?.toLocaleString()} savings
              </p>
            </div>
        
        {/* Month Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            {projections.map((projection, i) => (
              <button
                key={projection.month}
                onClick={() => !isAnimating && setSelectedMonth(i)}
                disabled={isAnimating}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  i === selectedMonth 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                } ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {projection.month}
              </button>
            ))}
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <BanknotesIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ${currentProjection.savings.toLocaleString()}
            </p>
            {improvement && (
              <p className="text-xs text-green-500 mt-1">
                +{improvement.savingsGrowth.toFixed(1)}% growth
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Monthly Spending</p>
            <p className="text-2xl font-bold text-blue-600">
              ${currentProjection.spending.toLocaleString()}
            </p>
            {improvement && (
              <p className="text-xs text-green-500 mt-1">
                -{improvement.spendingReduction.toFixed(1)}% reduction
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <HomeIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Emergency Fund</p>
            <p className="text-2xl font-bold text-orange-600">
              {currentProjection.emergencyFundMonths.toFixed(1)} months
            </p>
            <p className="text-xs text-gray-500 mt-1">of expenses covered</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <TrophyIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {currentProjection.savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">of income saved</p>
          </div>
        </div>
        
            {/* Achievement */}
            {currentProjection.achievement && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                <TrophyIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-bold text-green-800 text-lg mb-2">
                  🎉 Milestone Unlocked!
                </h4>
                <p className="text-green-700">
                  {currentProjection.achievement}
                </p>
              </div>
            )}
          </Box>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">How Expense Sorted Pro Makes This Possible</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Box variant="default" className="text-center">
                <ChartBarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Smart Insights</h3>
                <p className="text-gray-600 text-sm">
                  AI analyzes your spending patterns and finds optimization opportunities you'd never notice manually.
                </p>
              </Box>
              
              <Box variant="default" className="text-center">
                <BanknotesIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Automated Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Real-time bank sync means zero manual entry. Your progress updates automatically every day.
                </p>
              </Box>
              
              <Box variant="default" className="text-center">
                <AcademicCapIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Personalized Coaching</h3>
                <p className="text-gray-600 text-sm">
                  Weekly insights and challenges keep you motivated and on track to reach your goals faster.
                </p>
              </Box>
            </div>
          </div>

          {/* Reality Check */}
          <Box variant="elevated" className="text-center mb-8">
            <h3 className="text-xl font-bold mb-4">The Reality Check</h3>
            <p className="text-gray-600 mb-6">
              This projection assumes you follow Expense Sorted Pro's recommendations consistently. 
              Most users see 70-80% of these results, which is still life-changing progress.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  ${((currentProjection.savings - userData.savings!) || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Extra savings in 6 months</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  ${((projections[0].spending - currentProjection.spending) * 6 || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total spending reduced</p>
              </div>
            </div>
          </Box>

          {/* CTA */}
          <div className="text-center">
            <PrimaryButton
              onClick={() => goToScreen('whatHappensNext')}
              className="mb-4"
            >
              Get My Personalized Email Course
            </PrimaryButton>
            
            <div className="flex justify-center">
              <PrimaryButton
                onClick={() => goToScreen('initialInsights')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Insights
              </PrimaryButton>
            </div>
          </div>
      </main>
    </div>
  );
};

export default ProgressSimulatorScreen;
