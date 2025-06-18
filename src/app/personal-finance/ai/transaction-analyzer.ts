/**
 * Transaction Analyzer
 * 
 * Smart analysis of transaction data that combines mathematical calculations
 * with AI insights to find actionable spending patterns and savings opportunities.
 */

interface Transaction {
  id?: string;
  amount?: number;
  isDebit: boolean;
  category?: string;
  description?: string;
  date?: string | Date;
}

interface RecurringExpensePattern {
  pattern: string;
  category: string;
  transactions: Transaction[];
  frequency: number;
  averageAmount: number;
  monthlyEstimate: number;
  annualCost: number;
  confidence: 'high' | 'medium' | 'low';
  insight: string;
  actionable: string;
  potentialSavings: number;
}

interface SpendingInsight {
  type: 'recurring' | 'category' | 'frequency' | 'seasonal';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  savings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number;
}

interface TransactionAnalysis {
  totalTransactions: number;
  expenseTotal: number;
  incomeTotal: number;
  recurringExpenses: RecurringExpensePattern[];
  categoryInsights: SpendingInsight[];
  frequencyPatterns: SpendingInsight[];
  topSavingsOpportunities: SpendingInsight[];
  summary: string;
}

export class TransactionAnalyzer {
  /**
   * Analyze transactions to find patterns and savings opportunities
   */
  static analyzeTransactions(transactions: Transaction[]): TransactionAnalysis {
    const expenses = transactions.filter(t => t.isDebit && t.amount && t.amount > 0);
    const income = transactions.filter(t => !t.isDebit && t.amount && t.amount > 0);

    const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Find recurring expenses
    const recurringExpenses = this.findRecurringExpenses(expenses);
    
    // Analyze spending by category
    const categoryInsights = this.analyzeCategorySpending(expenses);
    
    // Find frequency patterns
    const frequencyPatterns = this.analyzeFrequencyPatterns(expenses);
    
    // Calculate top savings opportunities
    const topSavingsOpportunities = this.calculateSavingsOpportunities([
      ...categoryInsights,
      ...frequencyPatterns
    ]);

    // Generate summary
    const summary = this.generateSummary({
      totalExpenses,
      recurringExpenses,
      topSavingsOpportunities
    });

    return {
      totalTransactions: transactions.length,
      expenseTotal: totalExpenses,
      incomeTotal: totalIncome,
      recurringExpenses,
      categoryInsights,
      frequencyPatterns,
      topSavingsOpportunities,
      summary
    };
  }

  /**
   * Find recurring expenses by grouping similar transactions
   */
  private static findRecurringExpenses(expenses: Transaction[]): RecurringExpensePattern[] {
    const patterns: { [key: string]: Transaction[] } = {};

    // Group by normalized description
    expenses.forEach(transaction => {
      const normalizedDesc = this.normalizeDescription(transaction.description || '');
      if (normalizedDesc.length >= 3) {
        if (!patterns[normalizedDesc]) patterns[normalizedDesc] = [];
        patterns[normalizedDesc].push(transaction);
      }
    });

    // Filter for recurring patterns (3+ occurrences)
    const recurringPatterns = Object.entries(patterns)
      .filter(([_, txns]) => txns.length >= 3)
      .map(([pattern, txns]) => this.createRecurringPattern(pattern, txns))
      .sort((a, b) => b.annualCost - a.annualCost);

    return recurringPatterns;
  }

  /**
   * Create a recurring expense pattern from grouped transactions
   */
  private static createRecurringPattern(pattern: string, transactions: Transaction[]): RecurringExpensePattern {
    const amounts = transactions.map(t => t.amount || 0);
    const averageAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    
    // Estimate frequency - simple calculation based on transaction count
    const timeSpanDays = this.getTimeSpanDays(transactions);
    const frequency = transactions.length;
    const monthlyEstimate = timeSpanDays > 0 ? (frequency / timeSpanDays) * 30 : frequency;
    const annualCost = monthlyEstimate * averageAmount * 12;

    // Determine confidence based on consistency
    const variance = this.calculateVariance(amounts);
    const confidence = variance < (averageAmount * 0.2) ? 'high' : variance < (averageAmount * 0.5) ? 'medium' : 'low';

    // Get category from most common category in transactions
    const category = this.getMostCommonCategory(transactions);

    // Generate insights
    const { insight, actionable, potentialSavings } = this.generateRecurringInsights(
      pattern, 
      category, 
      averageAmount, 
      annualCost, 
      frequency
    );

    return {
      pattern,
      category,
      transactions,
      frequency,
      averageAmount,
      monthlyEstimate,
      annualCost,
      confidence,
      insight,
      actionable,
      potentialSavings
    };
  }

  /**
   * Analyze spending patterns by category
   */
  private static analyzeCategorySpending(expenses: Transaction[]): SpendingInsight[] {
    const categoryTotals: { [key: string]: { total: number; count: number; transactions: Transaction[] } } = {};

    expenses.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0, transactions: [] };
      }
      categoryTotals[category].total += transaction.amount || 0;
      categoryTotals[category].count += 1;
      categoryTotals[category].transactions.push(transaction);
    });

    const totalSpending = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

    return Object.entries(categoryTotals)
      .filter(([_, data]) => data.count >= 2) // At least 2 transactions
      .map(([category, data]) => {
        const percentage = (data.total / totalSpending) * 100;
        const average = data.total / data.count;
        
        return {
          type: 'category' as const,
          title: `${category} Spending Pattern`,
          description: `${data.count} transactions totaling $${data.total.toFixed(2)} (${percentage.toFixed(1)}% of spending)`,
          impact: percentage > 20 ? 'High impact category' : percentage > 10 ? 'Medium impact category' : 'Low impact category',
          recommendation: this.getCategoryRecommendation(category, percentage, average, data.count),
          savings: this.estimateCategorySavings(category, data.total),
          difficulty: this.getCategoryDifficulty(category),
          confidence: percentage > 5 ? 0.8 : 0.6
        };
      })
      .sort((a, b) => b.savings - a.savings);
  }

  /**
   * Analyze transaction frequency patterns
   */
  private static analyzeFrequencyPatterns(expenses: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];

    // Daily small purchases pattern
    const smallPurchases = expenses.filter(t => (t.amount || 0) < 20);
    if (smallPurchases.length > 10) {
      const total = smallPurchases.reduce((sum, t) => sum + (t.amount || 0), 0);
      const daily = total / 30; // Assume 30-day period
      
      insights.push({
        type: 'frequency',
        title: 'Small Daily Purchases',
        description: `${smallPurchases.length} small purchases under $20`,
        impact: `Adds up to $${total.toFixed(2)} monthly ($${(total * 12).toFixed(0)}/year)`,
        recommendation: 'Consider bundling purchases or setting a daily spending limit',
        savings: total * 0.3, // Potential 30% savings
        difficulty: 'easy',
        confidence: 0.7
      });
    }

    // Weekend spending pattern
    const weekendExpenses = expenses.filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    if (weekendExpenses.length > 5) {
      const weekendTotal = weekendExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const weekdayTotal = expenses.filter(t => {
        if (!t.date) return false;
        const date = new Date(t.date);
        const day = date.getDay();
        return day > 0 && day < 6;
      }).reduce((sum, t) => sum + (t.amount || 0), 0);

      if (weekendTotal > weekdayTotal * 0.4) { // Weekend spending is >40% of weekday spending
        insights.push({
          type: 'frequency',
          title: 'High Weekend Spending',
          description: `Weekend expenses: $${weekendTotal.toFixed(2)}`,
          impact: 'Weekend spending significantly higher than weekdays',
          recommendation: 'Plan weekend activities with budget in mind',
          savings: weekendTotal * 0.25, // Potential 25% weekend savings
          difficulty: 'medium',
          confidence: 0.6
        });
      }
    }

    return insights;
  }

  /**
   * Calculate top savings opportunities
   */
  private static calculateSavingsOpportunities(insights: SpendingInsight[]): SpendingInsight[] {
    return insights
      .filter(insight => insight.savings > 50) // Only meaningful savings
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5); // Top 5 opportunities
  }

  /**
   * Generate summary of analysis
   */
  private static generateSummary(data: {
    totalExpenses: number;
    recurringExpenses: RecurringExpensePattern[];
    topSavingsOpportunities: SpendingInsight[];
  }): string {
    const { totalExpenses, recurringExpenses, topSavingsOpportunities } = data;
    
    const recurringTotal = recurringExpenses.reduce((sum, exp) => sum + exp.annualCost, 0);
    const totalPotentialSavings = topSavingsOpportunities.reduce((sum, opp) => sum + opp.savings, 0);
    
    let summary = `Analysis of $${totalExpenses.toFixed(0)} in expenses reveals `;
    
    if (recurringExpenses.length > 0) {
      summary += `${recurringExpenses.length} recurring expense patterns totaling $${(recurringTotal/12).toFixed(0)}/month. `;
    }
    
    if (totalPotentialSavings > 100) {
      summary += `Potential savings of $${totalPotentialSavings.toFixed(0)}/month identified through spending optimization.`;
    } else {
      summary += `Your spending patterns show good control with minor optimization opportunities.`;
    }

    return summary;
  }

  // Helper methods
  private static normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private static getTimeSpanDays(transactions: Transaction[]): number {
    const dates = transactions
      .map(t => t.date ? new Date(t.date) : null)
      .filter(d => d !== null) as Date[];
    
    if (dates.length < 2) return 30; // Default assumption
    
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return Math.max(1, (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private static getMostCommonCategory(transactions: Transaction[]): string {
    const categoryCount: { [key: string]: number } = {};
    transactions.forEach(t => {
      const category = t.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Uncategorized';
  }

  private static generateRecurringInsights(
    pattern: string, 
    category: string, 
    averageAmount: number, 
    annualCost: number, 
    frequency: number
  ): { insight: string; actionable: string; potentialSavings: number } {
    let insight = `Recurring ${category.toLowerCase()} expense averaging $${averageAmount.toFixed(2)}`;
    let actionable = 'Review this recurring expense for optimization opportunities';
    let potentialSavings = 0;

    // Category-specific insights
    if (category.toLowerCase().includes('coffee') || category.toLowerCase().includes('food')) {
      insight = `Daily coffee/food purchases add up to $${annualCost.toFixed(0)} annually`;
      actionable = 'Consider meal prep or a coffee subscription to reduce costs';
      potentialSavings = annualCost * 0.4; // 40% potential savings
    } else if (category.toLowerCase().includes('subscription') || category.toLowerCase().includes('streaming')) {
      insight = `Subscription service costing $${(annualCost/12).toFixed(0)}/month`;
      actionable = 'Review if this subscription is actively used and worth the cost';
      potentialSavings = annualCost * 0.3; // 30% potential savings
    } else if (category.toLowerCase().includes('transport') || category.toLowerCase().includes('uber')) {
      insight = `Transport costs of $${(annualCost/12).toFixed(0)}/month might be optimizable`;
      actionable = 'Consider public transport or ride-sharing alternatives';
      potentialSavings = annualCost * 0.25; // 25% potential savings
    } else if (averageAmount < 10 && frequency > 10) {
      insight = `Small frequent purchases ($${averageAmount.toFixed(2)} each) total $${annualCost.toFixed(0)}/year`;
      actionable = 'Bundle small purchases or set a weekly limit';
      potentialSavings = annualCost * 0.3; // 30% potential savings
    }

    return { insight, actionable, potentialSavings };
  }

  private static getCategoryRecommendation(category: string, percentage: number, average: number, count: number): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('food') || categoryLower.includes('restaurant')) {
      return percentage > 15 ? 'Consider meal planning and cooking at home more often' : 'Food spending is reasonable, look for bulk buying opportunities';
    }
    
    if (categoryLower.includes('entertainment') || categoryLower.includes('recreation')) {
      return percentage > 10 ? 'Look for free or low-cost entertainment alternatives' : 'Entertainment spending is well-controlled';
    }
    
    if (categoryLower.includes('transport') || categoryLower.includes('fuel')) {
      return 'Consider carpooling, public transport, or combining trips';
    }
    
    if (categoryLower.includes('shopping') || categoryLower.includes('retail')) {
      return 'Implement a 24-hour waiting period before non-essential purchases';
    }
    
    return `Review ${category.toLowerCase()} expenses for potential optimization`;
  }

  private static estimateCategorySavings(category: string, total: number): number {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('food') || categoryLower.includes('restaurant')) {
      return total * 0.3; // 30% potential savings on food
    }
    
    if (categoryLower.includes('entertainment')) {
      return total * 0.4; // 40% potential savings on entertainment
    }
    
    if (categoryLower.includes('subscription')) {
      return total * 0.5; // 50% potential savings on subscriptions
    }
    
    return total * 0.15; // 15% default potential savings
  }

  private static getCategoryDifficulty(category: string): 'easy' | 'medium' | 'hard' {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('subscription') || categoryLower.includes('streaming')) {
      return 'easy'; // Easy to cancel subscriptions
    }
    
    if (categoryLower.includes('food') || categoryLower.includes('entertainment')) {
      return 'medium'; // Requires behavior change
    }
    
    if (categoryLower.includes('transport') || categoryLower.includes('housing')) {
      return 'hard'; // Structural changes needed
    }
    
    return 'medium';
  }
}

export type { Transaction, RecurringExpensePattern, SpendingInsight, TransactionAnalysis }; 