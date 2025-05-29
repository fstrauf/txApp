/**
 * Centralized Financial Rules Engine
 * 
 * This module provides a robust, validated approach to financial calculations
 * and recommendations. All financial logic is centralized here with proper
 * validation to prevent nonsensical recommendations.
 */

import React from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  BanknotesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// ===== CORE TYPES =====

export interface UserFinancialData {
  income: number;
  spending: number;
  savings: number;
  savingsBreakdown?: SavingsBreakdown;
  selectedBank?: string;
  savingsGoal?: string;
}

export interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

export interface InterestRates {
  checking: number;
  savings: number;
  highYieldSavings: number;
  termDeposit: number;
  conservativeInvestments: number;
  balancedInvestments: number;
  aggressiveInvestments: number;
}

export interface AllocationRecommendation {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
  rationale: string;
}

export interface ReturnAnalysis {
  currentRate: number;
  optimizedRate: number;
  difference: number;
  currentAnnualReturn: number;
  optimizedAnnualReturn: number;
  isOptimizationWorthwhile: boolean;
  rationale: string;
}

export interface FinancialInsight {
  type: 'success' | 'warning' | 'optimize';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  action: string;
  benchmark: string;
  priority: number; // 1-10, with 10 being highest priority
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SpendingAnalysis {
  totalSpending: number;
  averageDailySpending: number;
  spendingRate: number; // spending as percentage of income
  monthsOfRunway: number; // how long savings would last at current spending
  isSpendingSustainable: boolean;
  spendingBenchmark: 'excellent' | 'good' | 'concerning' | 'unsustainable';
  recommendations: SpendingRecommendation[];
}

export interface SpendingRecommendation {
  type: 'reduce_spending' | 'increase_income' | 'optimize_categories' | 'emergency_action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: string;
  actionSteps: string[];
}

export interface SpendingBreakdown {
  housing: number;
  food: number;
  transportation: number;
  utilities: number;
  entertainment: number;
  healthcare: number;
  shopping: number;
  other: number;
}

export interface SpendingAnalysis {
  totalSpending: number;
  averageDailySpending: number;
  spendingRate: number; // spending as percentage of income
  monthsOfRunway: number; // how long savings would last at current spending
  isSpendingSustainable: boolean;
  spendingBenchmark: 'excellent' | 'good' | 'concerning' | 'unsustainable';
  recommendations: SpendingRecommendation[];
}

export interface SpendingRecommendation {
  type: 'reduce_spending' | 'increase_income' | 'optimize_categories' | 'emergency_action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  timeframe: string;
  actionSteps: string[];
}

export interface SpendingBreakdown {
  housing: number;
  food: number;
  transportation: number;
  utilities: number;
  entertainment: number;
  healthcare: number;
  shopping: number;
  other: number;
}

// ===== CONFIGURATION =====

/**
 * Central configuration for all financial calculations
 * All rates and thresholds are defined here for easy maintenance
 */
export const FINANCIAL_CONFIG = {
  // Current market interest rates (update these regularly)
  INTEREST_RATES: {
    checking: 0.002,           // 0.2% - typical checking account
    savings: 0.025,            // 2.5% - average savings account
    highYieldSavings: 0.045,   // 4.5% - high-yield savings
    termDeposit: 0.050,        // 5.0% - 12-month term deposit
    conservativeInvestments: 0.06,  // 6% - conservative portfolio
    balancedInvestments: 0.08,      // 8% - balanced portfolio  
    aggressiveInvestments: 0.10     // 10% - aggressive portfolio
  } as InterestRates,

  // Savings rate benchmarks
  SAVINGS_RATE_BENCHMARKS: {
    excellent: 20,    // 20%+ is excellent
    good: 15,         // 15-20% is good
    average: 10,      // 10-15% is average
    concerning: 5,    // 5-10% needs attention
    critical: 0       // Below 5% is critical
  },

  // Emergency fund thresholds
  EMERGENCY_FUND: {
    minimum: 3,       // 3 months minimum
    recommended: 6,   // 6 months recommended
    maximum: 12       // 12 months maximum useful
  },

  // Optimization thresholds
  OPTIMIZATION: {
    minimumImprovementRate: 0.5,     // Must improve by at least 0.5%
    minimumDollarImprovement: 100,   // Must improve by at least $100/year
    minimumAmountToOptimize: 1000    // Don't optimize amounts under $1000
  },

  // Allocation guidelines
  ALLOCATION: {
    maxCheckingAmount: 1000,         // Max to keep in checking
    maxCheckingPercentage: 0.05,     // Max 5% in checking
    emergencyFundInSavings: true,    // Keep emergency fund in savings
    minInvestmentAmount: 5000        // Min amount before recommending investments
  },

  // Spending analysis thresholds
  SPENDING_ANALYSIS: {
    excellentSpendingRate: 0.5,    // Spending 50% or less of income is excellent
    goodSpendingRate: 0.7,         // 50-70% is good
    concerningSpendingRate: 0.9,   // 70-90% needs attention
    unsustainableSpendingRate: 1.0, // 90%+ is unsustainable
    minimumRunwayMonths: 3,        // Minimum 3 months of expenses in savings
    recommendedRunwayMonths: 6,    // Recommended 6 months
    optimalRunwayMonths: 12        // Optimal 12 months
  },

  // Spending category benchmarks (as percentage of after-tax income)
  SPENDING_BENCHMARKS: {
    housing: { min: 0.25, max: 0.35 },      // 25-35% for housing
    food: { min: 0.10, max: 0.15 },         // 10-15% for food
    transportation: { min: 0.10, max: 0.20 }, // 10-20% for transportation
    utilities: { min: 0.05, max: 0.10 },    // 5-10% for utilities
    entertainment: { min: 0.05, max: 0.10 }, // 5-10% for entertainment
    healthcare: { min: 0.05, max: 0.15 },   // 5-15% for healthcare
    shopping: { min: 0.05, max: 0.15 },     // 5-15% for shopping/misc
    other: { min: 0.00, max: 0.10 }         // 0-10% for other expenses
  }
};

// ===== PARAMETER VALIDATION =====

/**
 * Validates user financial data for logical consistency
 */
export function validateUserData(userData: UserFinancialData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (userData.income < 0) errors.push("Income cannot be negative");
  if (userData.spending < 0) errors.push("Spending cannot be negative");
  if (userData.savings < 0) errors.push("Savings cannot be negative");

  // Logical validation
  if (userData.spending > userData.income * 1.5) {
    warnings.push("Spending significantly exceeds income - this may not be sustainable");
  }

  if (userData.savings > userData.income * 10) {
    warnings.push("Savings is very high relative to income - please verify this is correct");
  }

  // Savings breakdown validation
  if (userData.savingsBreakdown) {
    const breakdown = userData.savingsBreakdown;
    const totalBreakdown = breakdown.checking + breakdown.savings + breakdown.termDeposit + breakdown.other;
    
    if (Math.abs(totalBreakdown - userData.savings) > 1) {
      errors.push("Savings breakdown doesn't match total savings amount");
    }

    if (breakdown.checking < 0 || breakdown.savings < 0 || breakdown.termDeposit < 0 || breakdown.other < 0) {
      errors.push("Savings breakdown cannot contain negative values");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates that optimization actually provides meaningful improvement
 */
export function validateOptimization(current: number, optimized: number, amount: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const improvement = optimized - current;
  const improvementPercentage = (improvement / current) * 100;
  const annualImprovement = amount * improvement;

  // Check if optimization is actually better
  if (improvement <= 0) {
    errors.push("Optimized rate is not better than current rate");
  }

  // Check if improvement is meaningful
  if (improvementPercentage < FINANCIAL_CONFIG.OPTIMIZATION.minimumImprovementRate) {
    warnings.push(`Improvement of ${improvementPercentage.toFixed(2)}% may not be worth the effort`);
  }

  if (annualImprovement < FINANCIAL_CONFIG.OPTIMIZATION.minimumDollarImprovement) {
    warnings.push(`Annual improvement of $${annualImprovement.toFixed(2)} may not be worth the effort`);
  }

  if (amount < FINANCIAL_CONFIG.OPTIMIZATION.minimumAmountToOptimize) {
    warnings.push(`Amount of $${amount.toLocaleString()} may be too small to optimize`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ===== CORE CALCULATION ENGINE =====

/**
 * Creates a default savings breakdown when none is provided
 */
function getDefaultBreakdown(totalSavings: number): SavingsBreakdown {
  // Conservative default allocation
  const emergencyFund = Math.min(totalSavings * 0.6, 20000); // Up to 60% or $20k for emergency
  const checking = Math.min(totalSavings * 0.1, 2000); // Up to 10% or $2k for checking
  const remaining = totalSavings - checking - emergencyFund;
  
  return {
    checking,
    savings: emergencyFund,
    termDeposit: Math.max(0, remaining * 0.5), // 50% of remaining in term deposits
    other: Math.max(0, remaining * 0.5) // 50% of remaining in other investments
  };
}

/**
 * Calculates current returns based on savings breakdown
 */
export function calculateCurrentReturns(userData: UserFinancialData): number {
  const breakdown = userData.savingsBreakdown || getDefaultBreakdown(userData.savings);
  const rates = FINANCIAL_CONFIG.INTEREST_RATES;

  return (
    breakdown.checking * rates.checking +
    breakdown.savings * rates.savings +
    breakdown.termDeposit * rates.termDeposit +
    breakdown.other * rates.conservativeInvestments
  ) / userData.savings;
}

/**
 * Generates optimized allocation based on user's situation
 */
export function generateOptimizedAllocation(userData: UserFinancialData): AllocationRecommendation {
  const totalSavings = userData.savings;
  const monthlyExpenses = userData.spending;
  const emergencyFundNeeded = monthlyExpenses * FINANCIAL_CONFIG.EMERGENCY_FUND.recommended;

  // Start with minimal checking account
  const checking = Math.min(
    FINANCIAL_CONFIG.ALLOCATION.maxCheckingAmount,
    totalSavings * FINANCIAL_CONFIG.ALLOCATION.maxCheckingPercentage
  );

  // Ensure adequate emergency fund in high-yield savings
  const emergencyFundAmount = Math.min(emergencyFundNeeded, totalSavings * 0.6);
  const savings = emergencyFundAmount;

  // Remaining amount for optimization
  const remaining = totalSavings - checking - savings;

  let termDeposit = 0;
  let other = 0;
  let rationale = "";

  if (remaining > 0) {
    if (totalSavings < FINANCIAL_CONFIG.ALLOCATION.minInvestmentAmount) {
      // Small amounts: keep in term deposits for safety
      termDeposit = remaining;
      rationale = "Conservative allocation for smaller amounts";
    } else if (emergencyFundAmount >= emergencyFundNeeded) {
      // Good emergency fund: can invest more aggressively
      termDeposit = Math.min(remaining * 0.2, 10000); // Max 20% or $10k in term deposits
      other = remaining - termDeposit;
      rationale = "Balanced allocation with investment focus";
    } else {
      // Building emergency fund: conservative approach
      termDeposit = remaining * 0.6;
      other = remaining * 0.4;
      rationale = "Conservative allocation while building emergency fund";
    }
  } else {
    rationale = "Focus on emergency fund first";
  }

  return {
    checking: Math.round(checking),
    savings: Math.round(savings),
    termDeposit: Math.round(termDeposit),
    other: Math.round(other),
    rationale
  };
}

/**
 * Calculates optimized returns with validation
 */
export function calculateOptimizedReturns(userData: UserFinancialData): ReturnAnalysis {
  const currentRate = calculateCurrentReturns(userData);
  const optimizedAllocation = generateOptimizedAllocation(userData);
  const rates = FINANCIAL_CONFIG.INTEREST_RATES;

  const optimizedRate = (
    optimizedAllocation.checking * rates.checking +
    optimizedAllocation.savings * rates.highYieldSavings +
    optimizedAllocation.termDeposit * rates.termDeposit +
    optimizedAllocation.other * rates.balancedInvestments
  ) / userData.savings;

  const currentAnnualReturn = userData.savings * currentRate;
  const optimizedAnnualReturn = userData.savings * optimizedRate;
  const difference = optimizedRate - currentRate;

  // Validate the optimization
  const validation = validateOptimization(currentRate, optimizedRate, userData.savings);
  const isOptimizationWorthwhile = validation.isValid && validation.warnings.length === 0;

  let rationale = "";
  if (!validation.isValid) {
    rationale = `Optimization not recommended: ${validation.errors.join(', ')}`;
  } else if (validation.warnings.length > 0) {
    rationale = `Limited benefit: ${validation.warnings.join(', ')}`;
  } else {
    rationale = `Meaningful improvement of ${(difference * 100).toFixed(1)}% (${((optimizedAnnualReturn - currentAnnualReturn)).toFixed(0)} extra annually)`;
  }

  return {
    currentRate,
    optimizedRate,
    difference,
    currentAnnualReturn,
    optimizedAnnualReturn,
    isOptimizationWorthwhile,
    rationale
  };
}

// ===== INSIGHT GENERATION =====

/**
 * Generates validated financial insights based on user data
 */
export function generateFinancialInsights(userData: UserFinancialData): FinancialInsight[] {
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return [{
      type: 'warning',
      icon: ExclamationTriangleIcon,
      title: 'Data validation errors',
      text: 'Please review your financial data for accuracy',
      action: validation.errors.join('. '),
      benchmark: 'Ensure all values are correct',
      priority: 10
    }];
  }

  const insights: FinancialInsight[] = [];
  const monthlySavings = userData.income - userData.spending;
  const savingsRate = userData.income > 0 ? (monthlySavings / userData.income) * 100 : 0;
  const monthsOfExpenses = userData.spending > 0 ? userData.savings / userData.spending : 0;

  // Savings rate insights
  insights.push(...generateSavingsRateInsights(savingsRate, monthlySavings));
  
  // Emergency fund insights
  insights.push(...generateEmergencyFundInsights(monthsOfExpenses, userData.spending, userData.savings, monthlySavings));
  
  // Optimization insights
  if (userData.savings >= FINANCIAL_CONFIG.OPTIMIZATION.minimumAmountToOptimize) {
    insights.push(...generateOptimizationInsights(userData));
  }

  // Spending analysis insights
  insights.push(...generateSpendingInsights(userData));

  // Sort by priority and return top insights
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

function generateSavingsRateInsights(savingsRate: number, monthlySavings: number): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const benchmarks = FINANCIAL_CONFIG.SAVINGS_RATE_BENCHMARKS;

  if (savingsRate >= benchmarks.excellent) {
    insights.push({
      type: 'success',
      icon: CheckCircleIcon,
      title: 'Excellent savings habit!',
      text: `Your ${savingsRate.toFixed(1)}% savings rate puts you in the top 10% of savers.`,
      action: 'Keep it up! Consider increasing by 2-3% if possible.',
      benchmark: `Annual savings: $${(monthlySavings * 12).toLocaleString()}`,
      priority: 7
    });
  } else if (savingsRate >= benchmarks.good) {
    insights.push({
      type: 'success',
      icon: CheckCircleIcon,
      title: 'Great savings rate!',
      text: `Your ${savingsRate.toFixed(1)}% savings rate is above average.`,
      action: 'Consider bumping it up to 20% if possible.',
      benchmark: `Annual savings: $${(monthlySavings * 12).toLocaleString()}`,
      priority: 6
    });
  } else if (savingsRate >= benchmarks.average) {
    insights.push({
      type: 'optimize',
      icon: LightBulbIcon,
      title: 'Room to improve savings',
      text: `Your ${savingsRate.toFixed(1)}% savings rate could be boosted.`,
      action: 'Try to increase to 15% by reducing one major expense category.',
      benchmark: 'Target: 15-20% savings rate',
      priority: 8
    });
  } else if (savingsRate > benchmarks.concerning) {
    insights.push({
      type: 'warning',
      icon: ExclamationTriangleIcon,
      title: 'Low savings rate needs attention',
      text: `Your ${savingsRate.toFixed(1)}% savings rate is below recommended minimums.`,
      action: 'Focus on reducing expenses or increasing income to save at least 10%.',
      benchmark: 'Minimum recommended: 10% savings rate',
      priority: 9
    });
  } else {
    insights.push({
      type: 'warning',
      icon: ExclamationCircleIcon,
      title: 'Critical: Not saving money',
      text: 'You\'re spending equal to or more than your income.',
      action: 'Review expenses urgently and cut non-essential spending.',
      benchmark: 'Start with saving just $50-100 per month',
      priority: 10
    });
  }

  return insights;
}

function generateEmergencyFundInsights(monthsOfExpenses: number, spending: number, savings: number, monthlySavings: number): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const minMonths = FINANCIAL_CONFIG.EMERGENCY_FUND.minimum;
  const recMonths = FINANCIAL_CONFIG.EMERGENCY_FUND.recommended;

  if (monthsOfExpenses >= recMonths) {
    insights.push({
      type: 'success',
      icon: ShieldCheckIcon,
      title: 'Excellent emergency fund!',
      text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months without income.`,
      action: 'Consider investing excess savings for higher returns.',
      benchmark: `Target met: ${recMonths} months of expenses`,
      priority: 5
    });
  } else if (monthsOfExpenses >= minMonths) {
    insights.push({
      type: 'optimize',
      icon: BanknotesIcon,
      title: 'Good emergency fund foundation',
      text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months without income.`,
      action: 'Consider building up to 6 months for extra security.',
      benchmark: `Target: $${(spending * recMonths).toLocaleString()} (6 months expenses)`,
      priority: 6
    });
  } else if (monthsOfExpenses >= 1) {
    const emergencyTarget = spending * minMonths;
    const timelineText = monthlySavings > 0 
      ? `Timeline: ${Math.ceil((emergencyTarget - savings) / monthlySavings)} months at current savings rate`
      : 'Focus on saving first';
    
    insights.push({
      type: 'warning',
      icon: ExclamationTriangleIcon,
      title: 'Build your emergency fund',
      text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months without income.`,
      action: `Build emergency fund to $${emergencyTarget.toLocaleString()} (3 months expenses) before other goals.`,
      benchmark: timelineText,
      priority: 8
    });
  } else {
    insights.push({
      type: 'warning',
      icon: ExclamationCircleIcon,
      title: 'No emergency buffer',
      text: 'You have very little savings to cover unexpected expenses.',
      action: 'Start building an emergency fund immediately - even $500 helps!',
      benchmark: 'First target: $1,000 emergency fund',
      priority: 9
    });
  }

  return insights;
}

function generateOptimizationInsights(userData: UserFinancialData): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  return insights;
}

function generateSpendingInsights(userData: UserFinancialData): FinancialInsight[] {
  const analysis = analyzeSpending(userData);

  const insights: FinancialInsight[] = [];
  if (analysis.spendingBenchmark === 'unsustainable') {
    insights.push({
      type: 'warning',
      icon: ExclamationCircleIcon,
      title: 'Spending exceeds income!',
      text: 'Your current spending level is not sustainable with your income.',
      action: 'Immediate reduction in spending is required.',
      benchmark: 'Reduce spending to at least 90% of income',
      priority: 10
    });
  } else if (analysis.spendingBenchmark === 'concerning') {
    insights.push({
      type: 'warning',
      icon: ExclamationTriangleIcon,
      title: 'High spending rate',
      text: 'Your spending is high relative to your income, which could be risky.',
      action: 'Consider reducing discretionary expenses.',
      benchmark: 'Target spending rate: under 90% of income',
      priority: 9
    });
  } else if (analysis.spendingBenchmark === 'good') {
    insights.push({
      type: 'optimize',
      icon: LightBulbIcon,
      title: 'Good spending rate',
      text: 'Your spending rate is within a reasonable range.',
      action: 'Aim to optimize further for savings or investments.',
      benchmark: 'Target spending rate: 50-70% of income',
      priority: 8
    });
  } else if (analysis.spendingBenchmark === 'excellent') {
    insights.push({
      type: 'success',
      icon: CheckCircleIcon,
      title: 'Excellent spending habits!',
      text: 'Your spending is well-managed and sustainable.',
      action: 'Continue your current habits and consider investing savings.',
      benchmark: 'Keep up the great work!',
      priority: 7
    });
  }

  return insights;
}

// ===== SPENDING ANALYSIS ENGINE =====

/**
 * Validates spending data and provides comprehensive analysis
 */
export function analyzeSpending(userData: UserFinancialData): SpendingAnalysis {
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
  }

  const totalSpending = userData.spending;
  const averageDailySpending = totalSpending / 30;
  const spendingRate = userData.income > 0 ? totalSpending / userData.income : 1;
  const monthsOfRunway = totalSpending > 0 ? userData.savings / totalSpending : 0;
  
  // Determine spending sustainability
  const isSpendingSustainable = spendingRate <= FINANCIAL_CONFIG.SPENDING_ANALYSIS.unsustainableSpendingRate;
  
  // Determine spending benchmark
  let spendingBenchmark: 'excellent' | 'good' | 'concerning' | 'unsustainable';
  if (spendingRate <= FINANCIAL_CONFIG.SPENDING_ANALYSIS.excellentSpendingRate) {
    spendingBenchmark = 'excellent';
  } else if (spendingRate <= FINANCIAL_CONFIG.SPENDING_ANALYSIS.goodSpendingRate) {
    spendingBenchmark = 'good';
  } else if (spendingRate <= FINANCIAL_CONFIG.SPENDING_ANALYSIS.concerningSpendingRate) {
    spendingBenchmark = 'concerning';
  } else {
    spendingBenchmark = 'unsustainable';
  }

  // Generate recommendations based on analysis
  const recommendations = generateSpendingRecommendations(userData, spendingRate, monthsOfRunway);

  return {
    totalSpending,
    averageDailySpending,
    spendingRate,
    monthsOfRunway,
    isSpendingSustainable,
    spendingBenchmark,
    recommendations
  };
}

/**
 * Generates validated spending recommendations based on user situation
 */
function generateSpendingRecommendations(
  userData: UserFinancialData, 
  spendingRate: number, 
  monthsOfRunway: number
): SpendingRecommendation[] {
  const recommendations: SpendingRecommendation[] = [];
  const monthlySavings = userData.income - userData.spending;

  // Critical situations first
  if (spendingRate >= FINANCIAL_CONFIG.SPENDING_ANALYSIS.unsustainableSpendingRate) {
    recommendations.push({
      type: 'emergency_action',
      priority: 'high',
      title: 'Emergency: Spending exceeds income',
      description: 'Your spending is equal to or greater than your income, which is unsustainable.',
      potentialSavings: userData.spending * 0.2, // Suggest 20% reduction as starting point
      timeframe: 'Immediate action required',
      actionSteps: [
        'List all expenses and identify non-essential items',
        'Cancel subscriptions and memberships you don\'t use',
        'Look for ways to reduce housing costs (roommate, downsizing)',
        'Consider additional income sources',
        'Create a strict budget and track every expense'
      ]
    });
  }

  // Low runway warnings
  if (monthsOfRunway < FINANCIAL_CONFIG.SPENDING_ANALYSIS.minimumRunwayMonths) {
    const targetEmergencyFund = userData.spending * FINANCIAL_CONFIG.SPENDING_ANALYSIS.minimumRunwayMonths;
    const monthsToTarget = monthlySavings > 0 ? 
      Math.ceil((targetEmergencyFund - userData.savings) / monthlySavings) : 
      999;

    recommendations.push({
      type: 'reduce_spending',
      priority: 'high',
      title: 'Build emergency fund urgently',
      description: `You have only ${monthsOfRunway.toFixed(1)} months of expenses saved. This is below the minimum recommended 3 months.`,
      potentialSavings: userData.spending * 0.1, // 10% spending reduction
      timeframe: monthsToTarget < 999 ? `${monthsToTarget} months at current rate` : 'Increase savings first',
      actionSteps: [
        'Reduce discretionary spending by 10-15%',
        'Cook at home more often',
        'Find cheaper alternatives for entertainment',
        'Review and optimize subscription services',
        `Target: Save additional $${Math.round((targetEmergencyFund - userData.savings) / monthsToTarget)} per month`
      ]
    });
  }

  // Spending rate optimization
  if (spendingRate > FINANCIAL_CONFIG.SPENDING_ANALYSIS.goodSpendingRate && 
      spendingRate < FINANCIAL_CONFIG.SPENDING_ANALYSIS.unsustainableSpendingRate) {
    const targetSpendingRate = FINANCIAL_CONFIG.SPENDING_ANALYSIS.goodSpendingRate;
    const targetSpending = userData.income * targetSpendingRate;
    const potentialSavings = userData.spending - targetSpending;

    recommendations.push({
      type: 'optimize_categories',
      priority: 'medium',
      title: 'Optimize your spending rate',
      description: `Your spending rate of ${(spendingRate * 100).toFixed(1)}% could be improved to reach the recommended 70% or less.`,
      potentialSavings,
      timeframe: '3-6 months',
      actionSteps: [
        'Track spending by category for 1 month',
        'Identify your top 3 spending categories',
        'Set specific reduction targets for each category',
        'Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings',
        `Target: Reduce spending by $${Math.round(potentialSavings)} per month`
      ]
    });
  }

  // Income increase recommendations
  if (monthlySavings < userData.income * 0.2 && spendingRate > 0.8) {
    recommendations.push({
      type: 'increase_income',
      priority: 'medium',
      title: 'Consider increasing your income',
      description: 'With limited room to cut expenses, increasing income could significantly improve your financial position.',
      potentialSavings: userData.income * 0.1, // 10% income increase
      timeframe: '6-12 months',
      actionSteps: [
        'Request a raise or promotion at your current job',
        'Develop skills that increase your market value',
        'Consider a side hustle or freelance work',
        'Look for higher-paying opportunities',
        'Monetize existing skills or hobbies'
      ]
    });
  }

  // Positive reinforcement for good spending habits
  if (spendingRate <= FINANCIAL_CONFIG.SPENDING_ANALYSIS.excellentSpendingRate) {
    recommendations.push({
      type: 'optimize_categories',
      priority: 'low',
      title: 'Excellent spending discipline!',
      description: `Your spending rate of ${(spendingRate * 100).toFixed(1)}% is excellent. Consider optimizing for higher returns.`,
      potentialSavings: 0,
      timeframe: 'Ongoing',
      actionSteps: [
        'Maintain your current spending discipline',
        'Focus on optimizing investment returns',
        'Consider geographic arbitrage opportunities',
        'Automate your savings to maintain habits',
        'Help others learn from your spending success'
      ]
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Validates spending breakdown against established benchmarks
 */
export function validateSpendingBreakdown(
  breakdown: SpendingBreakdown, 
  totalIncome: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const benchmarks = FINANCIAL_CONFIG.SPENDING_BENCHMARKS;

  Object.entries(breakdown).forEach(([category, amount]) => {
    const percentage = amount / totalIncome;
    const benchmark = benchmarks[category as keyof typeof benchmarks];
    
    if (benchmark) {
      if (percentage > benchmark.max) {
        warnings.push(
          `${category.charAt(0).toUpperCase() + category.slice(1)} spending (${(percentage * 100).toFixed(1)}%) exceeds recommended maximum of ${(benchmark.max * 100).toFixed(1)}%`
        );
      } else if (percentage < benchmark.min && category !== 'other') {
        // Don't warn about low spending unless it's suspiciously low
        if (percentage < benchmark.min * 0.5) {
          warnings.push(
            `${category.charAt(0).toUpperCase() + category.slice(1)} spending (${(percentage * 100).toFixed(1)}%) is unusually low - verify accuracy`
          );
        }
      }
    }
  });

  // Check if total breakdown makes sense
  const totalBreakdown = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
  if (Math.abs(totalBreakdown - totalIncome) > totalIncome * 0.05) {
    errors.push('Spending breakdown doesn\'t match total income within 5% tolerance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculates financial runway (how long money will last)
 */
export function calculateFinancialRunway(
  currentSavings: number, 
  monthlySpending: number,
  monthlyIncome: number = 0
): { months: number; years: number; isHealthy: boolean; recommendation: string } {
  if (monthlySpending <= 0) {
    throw new Error('Monthly spending must be greater than 0');
  }

  const netMonthlyChange = monthlyIncome - monthlySpending;
  
  let months: number;
  if (netMonthlyChange >= 0) {
    // Income covers expenses, runway is indefinite
    months = Infinity;
  } else {
    // Calculate how long savings will last
    months = currentSavings / Math.abs(netMonthlyChange);
  }

  const years = months / 12;
  const isHealthy = months >= FINANCIAL_CONFIG.SPENDING_ANALYSIS.recommendedRunwayMonths;
  
  let recommendation: string;
  if (months === Infinity) {
    recommendation = "Excellent! Your income covers expenses. Focus on optimizing savings and investments.";
  } else if (months >= FINANCIAL_CONFIG.SPENDING_ANALYSIS.optimalRunwayMonths) {
    recommendation = "Outstanding financial runway! Consider investing excess savings for growth.";
  } else if (months >= FINANCIAL_CONFIG.SPENDING_ANALYSIS.recommendedRunwayMonths) {
    recommendation = "Good financial buffer. Maintain this level while optimizing spending.";
  } else if (months >= FINANCIAL_CONFIG.SPENDING_ANALYSIS.minimumRunwayMonths) {
    recommendation = "Minimum runway achieved. Focus on building to 6+ months of expenses.";
  } else {
    recommendation = "Critical: Build emergency fund immediately. Reduce spending and increase savings.";
  }

  return {
    months: months === Infinity ? 999 : months,
    years: years === Infinity ? 999 : years,
    isHealthy,
    recommendation
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Formats a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a decimal as percentage (e.g., 0.05 -> "5.0%")
 */
export function formatPercentage(rate: number): string {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return '0.0%';
  }
  
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Calculates compound growth over time
 */
export function calculateCompoundGrowth(principal: number, annualRate: number, years: number): number {
  if (typeof principal !== 'number' || typeof annualRate !== 'number' || typeof years !== 'number') {
    throw new Error('All parameters must be numbers');
  }
  
  if (principal < 0 || annualRate < 0 || years < 0) {
    throw new Error('All parameters must be non-negative');
  }
  
  // A = P(1 + r)^t
  return principal * Math.pow(1 + annualRate, years);
}
