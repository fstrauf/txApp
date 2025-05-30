/**
 * Financial Advisor AI Middleware (Simplified)
 * 
 * This provides context enhancement for financial advice generation.
 * 
 * Note: This is temporarily simplified to avoid complex type compatibility issues 
 * with Vercel AI SDK v4. Full middleware functionality can be restored after 
 * type compatibility is resolved.
 */

import { 
  UserFinancialData,
  validateUserData,
  generateFinancialInsights,
  analyzeSpending,
  formatCurrency,
  formatPercentage
} from "../engine/FinancialRulesEngine";

/**
 * Generate enhanced context for financial advice
 */
export function generateFinancialContext(
  userData: UserFinancialData, 
  question?: string, 
  context?: string
): string {
  // Validate user data first
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return `Data validation errors: ${validation.errors.join(', ')}. Please address these issues.`;
  }

  // Generate comprehensive financial analysis
  const insights = generateFinancialInsights(userData);
  const spendingAnalysis = analyzeSpending(userData);
  
  // Calculate key financial metrics
  const savingsRate = userData.income > 0 
    ? ((userData.income - userData.spending) / userData.income) * 100 
    : 0;
  const monthsOfExpenses = userData.spending > 0 
    ? userData.savings / userData.spending 
    : 0;

  return `# User's Financial Situation Analysis

## Basic Metrics
- Monthly Income: ${formatCurrency(userData.income)}
- Monthly Spending: ${formatCurrency(userData.spending)}
- Total Savings: ${formatCurrency(userData.savings)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Emergency Fund: ${monthsOfExpenses.toFixed(1)} months of expenses

## Financial Health Assessment
- Spending Benchmark: ${spendingAnalysis.spendingBenchmark}
- Overall Status: ${savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'}

## Key Insights from Rules Engine
${insights.map(insight => `- ${insight.title}: ${insight.text}`).join('\n')}

## User Context
- Question: ${question || 'General financial advice'}
- Focus Area: ${context || 'general'}
- Savings Goal: ${userData.savingsGoal || 'Not specified'}

Please provide personalized advice based on this analysis, focusing on New Zealand financial context.`;
}

// Re-export for compatibility
export const financialAdvisorMiddleware = null; // Disabled for now