/**
 * Financial Advisor Service
 * 
 * This service provides an interface to interact with the AI-powered
 * financial advisor while maintaining validation through the rules engine.
 */

import { generateText, generateObject } from "ai";
import { financialAdvisorModel } from "./index";
import { z } from "zod";
import { 
  UserFinancialData,
  validateUserData,
  generateFinancialInsights,
  analyzeSpending,
  calculateOptimizedReturns,
  calculateFinancialRunway,
  formatCurrency,
  formatPercentage
} from "../engine/FinancialRulesEngine";
import type { 
  AIRecommendation, 
  AIFinancialInsight, 
  FinancialAdvisorQuery 
} from "./index";

// Schema for structured AI recommendations
const recommendationSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    type: z.enum(['insight', 'action', 'warning', 'education']),
    title: z.string(),
    description: z.string(),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.enum(['savings', 'spending', 'investing', 'planning', 'general']),
    actionSteps: z.array(z.string()).optional(),
  })),
  personalizedMessage: z.string(),
  nextSteps: z.array(z.string()),
  educationalTopics: z.array(z.string()),
});

export class FinancialAdvisorService {
  /**
   * Get personalized financial advice based on user's situation
   */
  async getPersonalizedAdvice(query: FinancialAdvisorQuery): Promise<AIFinancialInsight> {
    try {
      // Validate user data first
      const validation = validateUserData(query.userData);
      if (!validation.isValid) {
        throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
      }

      // Generate comprehensive analysis using rules engine
      const rulesInsights = generateFinancialInsights(query.userData);
      const spendingAnalysis = analyzeSpending(query.userData);
      const optimizedReturns = query.userData.savings >= 1000 ? calculateOptimizedReturns(query.userData) : null;
      const runwayAnalysis = calculateFinancialRunway(query.userData.savings, query.userData.spending);

      // Calculate key financial metrics
      const savingsRate = query.userData.income > 0 ? ((query.userData.income - query.userData.spending) / query.userData.income) * 100 : 0;
      const monthsOfExpenses = query.userData.spending > 0 ? query.userData.savings / query.userData.spending : 0;

      // Create comprehensive context for AI
      const financialContext = `
# User's Financial Situation

## Basic Information
- Monthly Income: ${formatCurrency(query.userData.income)}
- Monthly Spending: ${formatCurrency(query.userData.spending)}
- Total Savings: ${formatCurrency(query.userData.savings)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Emergency Fund: ${monthsOfExpenses.toFixed(1)} months of expenses
- Savings Goal: ${query.userData.savingsGoal || 'Not specified'}

## Financial Health Assessment
- Spending Benchmark: ${spendingAnalysis.spendingBenchmark}
- Financial Runway: ${runwayAnalysis.isHealthy ? 'Healthy' : 'Needs attention'}
- Overall Status: ${savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'}

## Key Insights from Rules Engine
${rulesInsights.map(insight => `- ${insight.title}: ${insight.text}`).join('\n')}

## Investment Optimization
${optimizedReturns ? `
- Current Return Rate: ${formatPercentage(optimizedReturns.currentRate)}
- Optimized Return Rate: ${formatPercentage(optimizedReturns.optimizedRate)}
- Potential Annual Gain: ${formatCurrency(optimizedReturns.optimizedAnnualReturn - optimizedReturns.currentAnnualReturn)}
` : 'Not enough savings for investment optimization analysis'}

## Context
User's question: ${query.question || 'General financial advice'}
Focus area: ${query.context || 'general'}
`;

      // Create prompt for AI advisor
      let promptText = `You are a financial advisor specializing in New Zealand personal finance. Based on the following financial analysis, provide personalized advice.

${financialContext}

Please provide:
1. A personalized message summarizing their financial health
2. 2-3 specific recommendations with clear reasoning
3. Next steps they can take
4. Educational topics to explore

Format your response as structured recommendations with clear priorities and actionable steps.`;

      // Generate structured recommendations using simpler approach
      const { object: structuredResponse } = await generateObject({
        model: financialAdvisorModel,
        schema: recommendationSchema,
        prompt: promptText,
      });

      // Validate recommendations against rules engine
      const validatedRecommendations = await this.validateRecommendations(
        structuredResponse.recommendations,
        query.userData
      );

      // Identify contextual factors
      const contextualFactors = this.identifyContextualFactors(
        query.userData,
        rulesInsights,
        spendingAnalysis
      );

      return {
        personalizedMessage: structuredResponse.personalizedMessage,
        recommendations: validatedRecommendations,
        contextualFactors,
        nextSteps: structuredResponse.nextSteps,
        educationalTopics: structuredResponse.educationalTopics,
      };

    } catch (error) {
      console.error('Error generating financial advice:', error);
      
      // Fallback to rules-based insights
      const rulesInsights = generateFinancialInsights(query.userData);
      return this.createFallbackAdvice(query.userData, rulesInsights);
    }
  }

  /**
   * Get a quick financial health check
   */
  async getFinancialHealthCheck(userData: UserFinancialData): Promise<{
    score: number;
    summary: string;
    topPriorities: string[];
  }> {
    try {
      const validation = validateUserData(userData);
      if (!validation.isValid) {
        return {
          score: 0,
          summary: "Unable to assess due to data validation errors.",
          topPriorities: validation.errors,
        };
      }

      const { text } = await generateText({
        model: financialAdvisorModel,
        prompt: `Provide a financial health score (0-100) and brief summary with top 3 priorities.

User Financial Data:
- Monthly Income: ${formatCurrency(userData.income)}
- Monthly Spending: ${formatCurrency(userData.spending)}
- Total Savings: ${formatCurrency(userData.savings)}
- Savings Rate: ${userData.income > 0 ? (((userData.income - userData.spending) / userData.income) * 100).toFixed(1) : 0}%

Provide a numerical score and 3 actionable priorities.`,
      });

      // Parse score from response (simplified - in production, use structured output)
      const scoreMatch = text.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      // Extract priorities (simplified parsing)
      const priorities = text.split('\n')
        .filter(line => line.match(/^\d+\.|^-\s/))
        .slice(0, 3)
        .map(line => line.replace(/^\d+\.\s*|\s*-\s*/g, ''));

      return {
        score: Math.min(100, Math.max(0, score)),
        summary: text.split('\n')[0] || "Financial health assessment completed.",
        topPriorities: priorities.length > 0 ? priorities : [
          "Build emergency fund",
          "Optimize spending",
          "Increase savings rate"
        ],
      };

    } catch (error) {
      console.error('Error generating health check:', error);
      
      // Fallback to rules-based assessment
      const insights = generateFinancialInsights(userData);
      const topInsights = insights.slice(0, 3);
      
      return {
        score: this.calculateRulesBasedScore(userData),
        summary: "Basic financial health assessment completed.",
        topPriorities: topInsights.map(insight => insight.title),
      };
    }
  }

  /**
   * Validate AI recommendations against rules engine
   */
  private async validateRecommendations(
    recommendations: any[],
    userData: UserFinancialData
  ): Promise<AIRecommendation[]> {
    const rulesInsights = generateFinancialInsights(userData);
    const spendingAnalysis = analyzeSpending(userData);

    return recommendations.map((rec, index) => ({
      ...rec,
      id: rec.id || `ai-rec-${index}`,
      validatedByRules: this.isRecommendationValid(rec, userData, rulesInsights, spendingAnalysis),
    }));
  }

  /**
   * Check if recommendation aligns with rules engine
   */
  private isRecommendationValid(
    recommendation: any,
    userData: UserFinancialData,
    rulesInsights: any[],
    spendingAnalysis: any
  ): boolean {
    // Check against basic financial rules
    if (recommendation.category === 'investing' && userData.savings < 1000) {
      return false; // Don't recommend investing without emergency fund
    }

    if (recommendation.category === 'spending' && spendingAnalysis.spendingBenchmark === 'unsustainable') {
      return recommendation.type === 'warning' || recommendation.priority === 'high';
    }

    // Add more validation rules as needed
    return true;
  }

  /**
   * Identify contextual factors affecting financial decisions
   */
  private identifyContextualFactors(
    userData: UserFinancialData,
    rulesInsights: any[],
    spendingAnalysis: any
  ): string[] {
    const factors: string[] = [];

    const savingsRate = userData.income > 0 ? ((userData.income - userData.spending) / userData.income) * 100 : 0;
    const monthsOfExpenses = userData.spending > 0 ? userData.savings / userData.spending : 0;

    if (savingsRate < 10) factors.push("Low savings rate requires immediate attention");
    if (monthsOfExpenses < 3) factors.push("Insufficient emergency fund");
    if (spendingAnalysis.spendingBenchmark === 'concerning') factors.push("High spending relative to income");
    if (userData.savings > userData.income * 5) factors.push("High savings-to-income ratio suggests investment opportunities");
    if (userData.savingsGoal) factors.push(`Working toward ${userData.savingsGoal} goal`);

    return factors;
  }

  /**
   * Create fallback advice using only rules engine
   */
  private createFallbackAdvice(
    userData: UserFinancialData,
    rulesInsights: any[]
  ): AIFinancialInsight {
    const spendingAnalysis = analyzeSpending(userData);
    
    return {
      personalizedMessage: "Based on your financial situation, here are the key recommendations from our analysis:",
      recommendations: rulesInsights.slice(0, 3).map((insight, index) => ({
        id: `rules-${index}`,
        type: insight.type === 'success' ? 'insight' : insight.type === 'warning' ? 'warning' : 'action',
        title: insight.title,
        description: insight.text,
        reasoning: insight.action,
        confidence: 0.9,
        priority: insight.priority >= 8 ? 'high' : insight.priority >= 6 ? 'medium' : 'low',
        category: 'general',
        validatedByRules: true,
      })) as AIRecommendation[],
      contextualFactors: this.identifyContextualFactors(userData, rulesInsights, spendingAnalysis),
      nextSteps: [
        "Review the recommendations above",
        "Start with the highest priority items",
        "Track your progress monthly"
      ],
      educationalTopics: [
        "Emergency fund basics",
        "Savings optimization",
        "Spending management"
      ],
    };
  }

  /**
   * Calculate basic score using rules engine
   */
  private calculateRulesBasedScore(userData: UserFinancialData): number {
    let score = 50; // Base score

    const savingsRate = userData.income > 0 ? ((userData.income - userData.spending) / userData.income) * 100 : 0;
    const monthsOfExpenses = userData.spending > 0 ? userData.savings / userData.spending : 0;

    // Savings rate scoring
    if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate >= 5) score += 5;
    else score -= 10;

    // Emergency fund scoring
    if (monthsOfExpenses >= 6) score += 20;
    else if (monthsOfExpenses >= 3) score += 10;
    else if (monthsOfExpenses >= 1) score += 5;
    else score -= 15;

    // Spending sustainability
    const spendingAnalysis = analyzeSpending(userData);
    if (spendingAnalysis.spendingBenchmark === 'excellent') score += 5;
    else if (spendingAnalysis.spendingBenchmark === 'unsustainable') score -= 20;

    return Math.min(100, Math.max(0, score));
  }
}

// Export singleton instance
export const financialAdvisorService = new FinancialAdvisorService();
