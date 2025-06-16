import { parseTransactionDate } from '@/lib/utils';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

export interface MonthlyAggregation {
  year: number;
  month: number;
  monthKey: string; // "2024-01" format for easy sorting
  monthName: string; // "Jan 2024" for display
  total: number;
  transactionCount: number;
  categories: CategoryAggregation[];
}

export interface CategoryAggregation {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageTransactionAmount: number;
}

export interface RollingMetrics {
  monthKey: string;
  rollingAverage: number;
  currentMonth: number;
  percentageChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TimeSeriesData {
  monthKey: string;
  monthName: string;
  categories: { [category: string]: number };
  total: number;
}

/**
 * High-performance data analysis engine for transaction data
 * Provides DataFrame-like functionality optimized for financial data
 */
export class DataAnalysisEngine {
  private transactions: Transaction[];
  private expenseTransactions: Transaction[];
  private monthlyCache: Map<string, MonthlyAggregation> = new Map();
  private categoryCache: Map<string, CategoryAggregation[]> = new Map();
  private _lastCacheUpdate: number = 0;

  constructor(transactions: Transaction[]) {
    this.transactions = transactions || [];
    this.expenseTransactions = this.transactions.filter(t => t.isDebit && t.amount > 0);
    this.buildCache();
  }

  /**
   * Build efficient caches for fast calculations
   */
  private buildCache(): void {
    this.monthlyCache.clear();
    this.categoryCache.clear();
    
    // Group transactions by month
    const monthlyGroups = new Map<string, Transaction[]>();
    
    this.expenseTransactions.forEach(transaction => {
      const date = parseTransactionDate(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(transaction);
    });

    // Build monthly aggregations
    monthlyGroups.forEach((transactions, monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });

      // Group by category for this month
      const categoryGroups = new Map<string, Transaction[]>();
      transactions.forEach(t => {
        if (!categoryGroups.has(t.category)) {
          categoryGroups.set(t.category, []);
        }
        categoryGroups.get(t.category)!.push(t);
      });

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const categories: CategoryAggregation[] = [];

      categoryGroups.forEach((categoryTransactions, category) => {
        const categoryAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        categories.push({
          category,
          amount: categoryAmount,
          percentage: totalAmount > 0 ? (categoryAmount / totalAmount) * 100 : 0,
          transactionCount: categoryTransactions.length,
          averageTransactionAmount: categoryAmount / categoryTransactions.length
        });
      });

      // Sort categories by amount descending
      categories.sort((a, b) => b.amount - a.amount);

      this.monthlyCache.set(monthKey, {
        year,
        month,
        monthKey,
        monthName,
        total: totalAmount,
        transactionCount: transactions.length,
        categories
      });
    });

    this._lastCacheUpdate = Date.now();
  }

  /**
   * Get all monthly aggregations sorted by date
   */
  getMonthlySpending(): MonthlyAggregation[] {
    return Array.from(this.monthlyCache.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }

  /**
   * Get spending by category over time for charting
   */
  getCategoryTimeSeriesData(): TimeSeriesData[] {
    const allCategories = new Set<string>();
    
    // Collect all unique categories
    this.monthlyCache.forEach(month => {
      month.categories.forEach(cat => allCategories.add(cat.category));
    });

    return Array.from(this.monthlyCache.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map(month => {
        const categories: { [category: string]: number } = {};
        
        // Initialize all categories to 0
        allCategories.forEach(cat => {
          categories[cat] = 0;
        });
        
        // Fill in actual amounts
        month.categories.forEach(cat => {
          categories[cat.category] = cat.amount;
        });

        return {
          monthKey: month.monthKey,
          monthName: month.monthName,
          categories,
          total: month.total
        };
      });
  }

  /**
   * Calculate rolling averages for a specific period
   */
  getRollingMetrics(category?: string, rollingPeriods: number = 6): RollingMetrics[] {
    const monthlyData = this.getMonthlySpending();
    const results: RollingMetrics[] = [];

    for (let i = rollingPeriods - 1; i < monthlyData.length; i++) {
      const currentMonth = monthlyData[i];
      const rollingWindow = monthlyData.slice(i - rollingPeriods + 1, i + 1);
      
      let currentValue: number;
      let rollingSum: number;

      if (category) {
        // Calculate for specific category
        currentValue = currentMonth.categories.find(c => c.category === category)?.amount || 0;
        rollingSum = rollingWindow.reduce((sum, month) => {
          const catAmount = month.categories.find(c => c.category === category)?.amount || 0;
          return sum + catAmount;
        }, 0);
      } else {
        // Calculate for total spending
        currentValue = currentMonth.total;
        rollingSum = rollingWindow.reduce((sum, month) => sum + month.total, 0);
      }

      const rollingAverage = rollingSum / rollingPeriods;
      const percentageChange = rollingAverage > 0 ? 
        ((currentValue - rollingAverage) / rollingAverage) * 100 : 0;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(percentageChange) > 5) {
        trend = percentageChange > 0 ? 'increasing' : 'decreasing';
      }

      results.push({
        monthKey: currentMonth.monthKey,
        rollingAverage,
        currentMonth: currentValue,
        percentageChange,
        trend
      });
    }

    return results;
  }

  /**
   * Get top categories by spending amount
   */
  getTopCategories(limit: number = 10): CategoryAggregation[] {
    const categoryTotals = new Map<string, {
      amount: number;
      transactionCount: number;
      transactions: Transaction[];
    }>();

    this.expenseTransactions.forEach(transaction => {
      if (!categoryTotals.has(transaction.category)) {
        categoryTotals.set(transaction.category, {
          amount: 0,
          transactionCount: 0,
          transactions: []
        });
      }
      const category = categoryTotals.get(transaction.category)!;
      category.amount += transaction.amount;
      category.transactionCount += 1;
      category.transactions.push(transaction);
    });

    const totalSpending = Array.from(categoryTotals.values())
      .reduce((sum, cat) => sum + cat.amount, 0);

    return Array.from(categoryTotals.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
        transactionCount: data.transactionCount,
        averageTransactionAmount: data.amount / data.transactionCount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  /**
   * Compare current month to previous periods
   */
  getCurrentMonthComparison(): {
    currentMonth: MonthlyAggregation | null;
    previousMonth: MonthlyAggregation | null;
    sameMonthLastYear: MonthlyAggregation | null;
    monthOverMonthChange: number;
    yearOverYearChange: number;
  } {
    const monthlyData = this.getMonthlySpending();
    if (monthlyData.length === 0) {
      return {
        currentMonth: null,
        previousMonth: null,
        sameMonthLastYear: null,
        monthOverMonthChange: 0,
        yearOverYearChange: 0
      };
    }

    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
    
    // Find same month last year
    const currentYear = currentMonth.year;
    const currentMonthNum = currentMonth.month;
    const sameMonthLastYear = monthlyData.find(m => 
      m.year === currentYear - 1 && m.month === currentMonthNum
    ) || null;

    const monthOverMonthChange = previousMonth ? 
      ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100 : 0;
    
    const yearOverYearChange = sameMonthLastYear ? 
      ((currentMonth.total - sameMonthLastYear.total) / sameMonthLastYear.total) * 100 : 0;

    return {
      currentMonth,
      previousMonth,
      sameMonthLastYear,
      monthOverMonthChange,
      yearOverYearChange
    };
  }

  /**
   * Get seasonal spending patterns
   */
  getSeasonalPatterns(): { [season: string]: { averageSpending: number; months: number[] } } {
    const seasonalData = {
      Spring: { total: 0, count: 0, months: [3, 4, 5] },
      Summer: { total: 0, count: 0, months: [6, 7, 8] },
      Fall: { total: 0, count: 0, months: [9, 10, 11] },
      Winter: { total: 0, count: 0, months: [12, 1, 2] }
    };

    this.monthlyCache.forEach(month => {
      const monthNum = month.month;
      
      if ([3, 4, 5].includes(monthNum)) {
        seasonalData.Spring.total += month.total;
        seasonalData.Spring.count++;
      } else if ([6, 7, 8].includes(monthNum)) {
        seasonalData.Summer.total += month.total;
        seasonalData.Summer.count++;
      } else if ([9, 10, 11].includes(monthNum)) {
        seasonalData.Fall.total += month.total;
        seasonalData.Fall.count++;
      } else {
        seasonalData.Winter.total += month.total;
        seasonalData.Winter.count++;
      }
    });

    return Object.fromEntries(
      Object.entries(seasonalData).map(([season, data]) => [
        season,
        {
          averageSpending: data.count > 0 ? data.total / data.count : 0,
          months: data.months
        }
      ])
    );
  }

  /**
   * Get spending trends and anomalies
   */
  getSpendingAnomalies(thresholdPercentage: number = 50): {
    month: MonthlyAggregation;
    category: string;
    amount: number;
    averageAmount: number;
    deviationPercentage: number;
  }[] {
    const anomalies: {
      month: MonthlyAggregation;
      category: string;
      amount: number;
      averageAmount: number;
      deviationPercentage: number;
    }[] = [];

    // Calculate average spending per category across all months
    const categoryAverages = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    this.monthlyCache.forEach(month => {
      month.categories.forEach(cat => {
        categoryAverages.set(cat.category, 
          (categoryAverages.get(cat.category) || 0) + cat.amount);
        categoryCounts.set(cat.category, 
          (categoryCounts.get(cat.category) || 0) + 1);
      });
    });

    // Calculate averages
    categoryAverages.forEach((total, category) => {
      const count = categoryCounts.get(category) || 1;
      categoryAverages.set(category, total / count);
    });

    // Find anomalies
    this.monthlyCache.forEach(month => {
      month.categories.forEach(cat => {
        const average = categoryAverages.get(cat.category) || 0;
        if (average > 0) {
          const deviationPercentage = ((cat.amount - average) / average) * 100;
          
          if (Math.abs(deviationPercentage) > thresholdPercentage) {
            anomalies.push({
              month,
              category: cat.category,
              amount: cat.amount,
              averageAmount: average,
              deviationPercentage
            });
          }
        }
      });
    });

    return anomalies.sort((a, b) => Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage));
  }

  /**
   * Calculate actual income from credit transactions
   */
  getActualIncome(): {
    totalIncome: number;
    averageMonthlyIncome: number;
    incomeTransactions: Transaction[];
    incomeByCategory: { [category: string]: number };
  } {
    // Get all credit transactions (income)
    const incomeTransactions = this.transactions.filter(t => !t.isDebit && t.amount > 0);
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = this.monthlyCache.size;
    
    // Group income by category
    const incomeByCategory: { [category: string]: number } = {};
    incomeTransactions.forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });

    return {
      totalIncome,
      averageMonthlyIncome: monthsOfData > 0 ? totalIncome / monthsOfData : 0,
      incomeTransactions,
      incomeByCategory
    };
  }

  /**
   * Get spending rate based on actual income vs expenses
   */
  getActualSpendingRate(): {
    actualIncome: number;
    totalExpenses: number;
    spendingRate: number;
    monthlySpendingRate: number;
    hasIncomeData: boolean;
  } {
    const incomeData = this.getActualIncome();
    const totalExpenses = this.expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = this.monthlyCache.size;
    
    const monthlyIncome = incomeData.averageMonthlyIncome;
    const monthlyExpenses = monthsOfData > 0 ? totalExpenses / monthsOfData : 0;
    
    return {
      actualIncome: incomeData.totalIncome,
      totalExpenses,
      spendingRate: incomeData.totalIncome > 0 ? (totalExpenses / incomeData.totalIncome) * 100 : 0,
      monthlySpendingRate: monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0,
      hasIncomeData: incomeData.incomeTransactions.length > 0
    };
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalTransactions: number;
    totalSpending: number;
    averageMonthlySpending: number;
    averageTransactionAmount: number;
    monthsOfData: number;
    categoriesCount: number;
    accountsCount: number;
    actualIncome: number;
    averageMonthlyIncome: number;
    hasIncomeData: boolean;
  } {
    const uniqueCategories = new Set(this.expenseTransactions.map(t => t.category));
    const uniqueAccounts = new Set(this.expenseTransactions.map(t => t.account));
    const totalSpending = this.expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = this.monthlyCache.size;
    const incomeData = this.getActualIncome();

    return {
      totalTransactions: this.expenseTransactions.length,
      totalSpending,
      averageMonthlySpending: monthsOfData > 0 ? totalSpending / monthsOfData : 0,
      averageTransactionAmount: this.expenseTransactions.length > 0 ? 
        totalSpending / this.expenseTransactions.length : 0,
      monthsOfData,
      categoriesCount: uniqueCategories.size,
      accountsCount: uniqueAccounts.size,
      actualIncome: incomeData.totalIncome,
      averageMonthlyIncome: incomeData.averageMonthlyIncome,
      hasIncomeData: incomeData.incomeTransactions.length > 0
    };
  }

  /**
   * Refresh cache if data has changed
   */
  refreshIfNeeded(newTransactions: Transaction[]): void {
    if (newTransactions !== this.transactions || 
        newTransactions.length !== this.transactions.length) {
      this.transactions = newTransactions;
      this.expenseTransactions = this.transactions.filter(t => t.isDebit && t.amount > 0);
      this.buildCache();
    }
  }
} 