export interface DashboardStats {
  monthlyAverageIncome: number;
  monthlyAverageSavings: number;
  monthlyAverageExpenses: number;
  lastMonthExpenses: number;
  lastMonthIncome: number;
  annualExpenseProjection: number;
  lastDataRefresh?: Date;
}

export interface Transaction {
  date: string;
  amount: number;
  isDebit: boolean;
  category?: string;
}

export const calculateStatsFromTransactions = (transactions: Transaction[]): DashboardStats => {
  if (!transactions.length) {
    return {
      monthlyAverageIncome: 0,
      monthlyAverageExpenses: 0,
      monthlyAverageSavings: 0,
      lastMonthExpenses: 0,
      lastMonthIncome: 0,
      annualExpenseProjection: 0,
      lastDataRefresh: new Date(),
    };
  }

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  
  // === SMART DATE LOGIC ===
  // Calculate actual data span
  const transactionDates = transactions.map(t => new Date(t.date));
  const oldestDate = new Date(Math.min(...transactionDates.map(d => d.getTime())));
  const newestDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
  
  // Calculate actual months spanned
  const actualMonths = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  // Determine which transactions to use and how many months to divide by
  let transactionsToUse = transactions;
  let monthsToUseForAverage = actualMonths;
  
  if (actualMonths > 12) {
    // Use rolling 12-month window (last 12 months only)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    
    transactionsToUse = transactions.filter(t => new Date(t.date) >= twelveMonthsAgo);
    monthsToUseForAverage = 12;
  }
  // If ≤ 12 months, use all data and actual months (already set above)
  
  // === CALCULATE INCOME AND EXPENSES ===
  const expenses = transactionsToUse.filter(t => t.isDebit || t.amount < 0);
  const income = transactionsToUse.filter(t => !t.isDebit && t.amount > 0);
  
  const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Calculate monthly averages using smart division
  const monthlyAverageIncome = totalIncome / monthsToUseForAverage;
  const monthlyAverageExpenses = totalExpenses / monthsToUseForAverage;
  const monthlyAverageSavings = monthlyAverageIncome - monthlyAverageExpenses;
  
  // === LAST MONTH EXPENSES (fixed date filtering) ===
  const lastMonthExpenses = expenses
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= lastMonth && transactionDate <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // === LAST MONTH INCOME (fixed date filtering) ===
  const lastMonthIncome = income
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= lastMonth && transactionDate <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return {
    monthlyAverageIncome: Math.round(monthlyAverageIncome),
    monthlyAverageExpenses: Math.round(monthlyAverageExpenses),
    monthlyAverageSavings: Math.round(monthlyAverageSavings),
    lastMonthExpenses: Math.round(lastMonthExpenses),
    lastMonthIncome: Math.round(lastMonthIncome),
    annualExpenseProjection: Math.round(monthlyAverageExpenses * 12),
    lastDataRefresh: new Date(),
  };
};

export const filterTransferTransactions = (transactions: Transaction[], hideTransfer: boolean): Transaction[] => {
  if (!hideTransfer) return transactions;
  
  return transactions.filter(t => 
    t.category?.toLowerCase() !== 'transfer' && 
    t.category?.toLowerCase() !== 'transfers'
  );
}; 