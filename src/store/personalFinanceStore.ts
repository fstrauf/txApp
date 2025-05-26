// src/store/personalFinanceStore.ts
import { create } from 'zustand';

interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

// Transaction interface for imported data
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

// Category spending breakdown
interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface UserData {
  income: number;
  spending: number;
  savings: number;
  savingsBreakdown?: SavingsBreakdown;
  selectedBank?: string;
  savingsGoal?: string;
  // Transaction data
  transactions?: Transaction[];
  categorySpending?: CategorySpending[];
  actualMonthlySpending?: number; // Calculated from transactions
}

interface PersonalFinanceState {
  userData: UserData;
  updateIncome: (income: number) => void;
  updateSpending: (spending: number) => void;
  updateSavings: (savings: number) => void;
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => void;
  updateSelectedBank: (bank: string) => void;
  updateSavingsGoal: (goal: string) => void;
  // Transaction management
  updateTransactions: (transactions: Transaction[]) => void;
  processTransactionData: (transactions: Transaction[]) => void;
}

export const usePersonalFinanceStore = create<PersonalFinanceState>((set) => ({
  userData: {
    income: 0,
    spending: 0,
    savings: 0,
  },
  
  updateIncome: (income: number) => {
    set((state) => ({
      userData: { ...state.userData, income }
    }));
  },
  
  updateSpending: (spending: number) => {
    set((state) => ({
      userData: { ...state.userData, spending }
    }));
  },
  
  updateSavings: (savings: number) => {
    set((state) => ({
      userData: { ...state.userData, savings }
    }));
  },
  
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => {
    set((state) => ({
      userData: { ...state.userData, savingsBreakdown: breakdown }
    }));
  },
  
  updateSelectedBank: (bank: string) => {
    set((state) => ({
      userData: { ...state.userData, selectedBank: bank }
    }));
  },
  
  updateSavingsGoal: (goal: string) => {
    set((state) => ({
      userData: { ...state.userData, savingsGoal: goal }
    }));
  },

  updateTransactions: (transactions: Transaction[]) => {
    set((state) => ({
      userData: { ...state.userData, transactions }
    }));
  },

  processTransactionData: (transactions: Transaction[]) => {
    // Process transactions to calculate spending breakdown and categories
    const spendingTransactions = transactions.filter(t => t.isDebit && t.amount > 0);
    
    // Calculate category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalSpending = 0;

    spendingTransactions.forEach(transaction => {
      totalSpending += transaction.amount;
      
      const category = transaction.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1
      });
    });

    // Convert to category spending array
    const categorySpending: CategorySpending[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
      transactionCount: data.count
    })).sort((a, b) => b.amount - a.amount);

    // Calculate monthly spending (assume transactions are from multiple months, so average them)
    const monthsOfData = transactions.length > 0 ? 
      Math.max(1, Math.ceil(transactions.length / 100)) : 1; // Rough estimate
    const actualMonthlySpending = totalSpending / monthsOfData;

    set((state) => ({
      userData: { 
        ...state.userData, 
        transactions,
        categorySpending,
        actualMonthlySpending,
        // Update spending if significantly different or if not set
        spending: state.userData.spending === 0 ? actualMonthlySpending : state.userData.spending
      }
    }));
  },
}));