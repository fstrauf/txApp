import { startOfMonth, endOfMonth, format } from 'date-fns';
import { prisma } from './prisma';

// Helper type for lunch money transactions
interface LunchMoneyTransaction {
  amount: number;
  is_income?: boolean;
  originalData?: {
    category_id?: string | number;
    category_name?: string;
  };
  category_id?: string | number;
  lunchMoneyCategory?: string;
  category_name?: string;
}

// Helper type for lunch money categories
interface LunchMoneyCategory {
  id: string | number;
  name: string;
}

/**
 * Aggregate transaction data into monthly summaries using Lunch Money API
 */
export async function aggregateMonthlyData(userId: string, month: Date) {
  // Normalize the date to the first day of the month
  const targetMonth = startOfMonth(month);
  
  // Define date range for the month
  const startDate = startOfMonth(targetMonth);
  const endDate = endOfMonth(targetMonth);
  
  // Format dates for Lunch Money API
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  // Get the user's Lunch Money API key
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lunchMoneyApiKey: true },
  });
  
  if (!user?.lunchMoneyApiKey) {
    throw new Error('Lunch Money API key not found for user');
  }
  
  // Fetch directly from Lunch Money API (server-side)
  async function fetchLunchMoneyTransactions(): Promise<LunchMoneyTransaction[]> {
    try {
      const response = await fetch(`https://dev.lunchmoney.app/v1/transactions?start_date=${formattedStartDate}&end_date=${formattedEndDate}`, {
        headers: {
          'Authorization': `Bearer ${user!.lunchMoneyApiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from Lunch Money API: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions from Lunch Money:', error);
      throw new Error('Failed to get transactions from Lunch Money API');
    }
  }
  
  // Fetch categories from Lunch Money API
  async function fetchLunchMoneyCategories(): Promise<LunchMoneyCategory[]> {
    try {
      const response = await fetch('https://dev.lunchmoney.app/v1/categories', {
        headers: {
          'Authorization': `Bearer ${user!.lunchMoneyApiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories from Lunch Money API: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching categories from Lunch Money:', error);
      throw new Error('Failed to get categories from Lunch Money API');
    }
  }
  
  // Get data from Lunch Money
  const transactions = await fetchLunchMoneyTransactions();
  const lunchMoneyCategories = await fetchLunchMoneyCategories();
  
  // Separate income and expense transactions
  const incomeTransactions = transactions.filter(tx => tx.amount > 0 || tx.is_income);
  const expenseTransactions = transactions.filter(tx => tx.amount < 0 && !tx.is_income);
  
  // Calculate total income
  const income = incomeTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Calculate total expenses (convert to positive for calculations)
  const expenses = expenseTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Calculate main metrics
  const netIncome = income;
  const netSavings = income - expenses;
  const netBurn = expenses;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;
  
  // Get or create categories for each Lunch Money category
  const categoryMap = new Map();
  
  for (const lmCategory of lunchMoneyCategories) {
    // Look for existing category mapping
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name: lmCategory.name,
      },
    });
    
    // Create category if it doesn't exist
    if (!category) {
      category = await prisma.category.create({
        data: {
          userId,
          name: lmCategory.name,
          isDefault: false,
        },
      });
    }
    
    // Map Lunch Money category ID to our category ID
    categoryMap.set(lmCategory.id, category.id);
  }
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  
  for (const tx of expenseTransactions) {
    // Get category from transaction (handling different field structures)
    const categoryId = tx.originalData?.category_id || tx.category_id;
    const categoryName = tx.originalData?.category_name || tx.lunchMoneyCategory || tx.category_name;
    
    if (categoryId && categoryMap.get(categoryId)) {
      const mappedCategoryId = categoryMap.get(categoryId);
      if (!expensesByCategory[mappedCategoryId]) {
        expensesByCategory[mappedCategoryId] = 0;
      }
      expensesByCategory[mappedCategoryId] += Math.abs(tx.amount);
    } else if (categoryName) {
      // Find or create the category by name
      let category = await prisma.category.findFirst({
        where: {
          userId,
          name: categoryName,
        },
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: {
            userId,
            name: categoryName,
            isDefault: false,
          },
        });
      }
      
      if (!expensesByCategory[category.id]) {
        expensesByCategory[category.id] = 0;
      }
      expensesByCategory[category.id] += Math.abs(tx.amount);
    }
  }
  
  // Create or update monthly aggregate
  const monthlyAggregate = await prisma.monthlyAggregate.upsert({
    where: {
      userId_month: {
        userId,
        month: targetMonth,
      },
    },
    create: {
      userId,
      month: targetMonth,
      income,
      expenses,
      netIncome,
      netSavings,
      netBurn,
      savingsRate,
    },
    update: {
      income,
      expenses,
      netIncome,
      netSavings,
      netBurn,
      savingsRate,
    },
  });
  
  // Delete existing category expenses for this month
  await prisma.categoryExpense.deleteMany({
    where: {
      monthlyAggregateId: monthlyAggregate.id,
    },
  });
  
  // Create category expenses
  const categoryExpensePromises = Object.entries(expensesByCategory).map(
    ([categoryId, amount]) => 
      prisma.categoryExpense.create({
        data: {
          monthlyAggregateId: monthlyAggregate.id,
          categoryId,
          amount,
        },
      })
  );
  
  await Promise.all(categoryExpensePromises);
  
  return monthlyAggregate;
}

/**
 * Get monthly financial data for a date range
 */
export async function getMonthlyFinancialData(userId: string, startDate: Date, endDate: Date) {
  const monthlyData = await prisma.monthlyAggregate.findMany({
    where: {
      userId,
      month: {
        gte: startOfMonth(startDate),
        lte: endOfMonth(endDate),
      },
    },
    include: {
      categoryExpenses: {
        include: {
          category: true,
        }
      },
    },
    orderBy: {
      month: 'asc',
    },
  });
  
  return monthlyData;
}

/**
 * Get the latest month's financial data
 */
export async function getLatestMonthlyData(userId: string) {
  const latestMonth = await prisma.monthlyAggregate.findFirst({
    where: {
      userId,
    },
    include: {
      categoryExpenses: {
        include: {
          category: true,
        }
      },
    },
    orderBy: {
      month: 'desc',
    },
  });
  
  return latestMonth;
}

/**
 * Force recalculation of monthly aggregates for a specific date range
 */
export async function recalculateMonthlyAggregates(userId: string, startDate: Date, endDate: Date) {
  // Generate array of months between start and end dates
  const months: Date[] = [];
  let currentMonth = startOfMonth(startDate);
  const endMonth = startOfMonth(endDate);
  
  while (currentMonth <= endMonth) {
    months.push(new Date(currentMonth));
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  // Recalculate each month
  const recalculationPromises = months.map(month => 
    aggregateMonthlyData(userId, month)
  );
  
  await Promise.all(recalculationPromises);
  
  return {
    success: true,
    monthsProcessed: months.length,
  };
} 