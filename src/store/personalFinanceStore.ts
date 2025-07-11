// src/store/personalFinanceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction } from '@/types/personalFinance';

interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

// Transaction interface for imported data is now in personalFinance.ts

// Category spending breakdown
interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface SavingsSheetData {
  latestNetAssetValue: number;
  latestQuarter: string;
  formattedValue: string;
  totalEntries: number;
}

interface UserData {
  income: number;
  spending: number;
  savings: number;
  savingsBreakdown?: SavingsBreakdown;
  selectedBank?: string;
  savingsGoal?: string;
  // Spreadsheet integration
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastDataRefresh?: string;
  // Transaction data
  transactions?: Transaction[];
  categorySpending?: CategorySpending[];
  actualMonthlySpending?: number; // Calculated from transactions
  // Savings sheet data (cached from Google Sheets)
  savingsSheetData?: SavingsSheetData;
  // Currency settings
  baseCurrency?: string; // Default base currency for the user
}

interface PersonalFinanceState {
  userData: UserData;
  updateIncome: (income: number) => void;
  updateSpending: (spending: number) => void;
  updateSavings: (savings: number) => void;
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => void;
  updateSelectedBank: (bank: string) => void;
  updateSavingsGoal: (goal: string) => void;
  // Spreadsheet management
  updateSpreadsheetInfo: (spreadsheetId: string, spreadsheetUrl: string) => void;
  updateLastDataRefresh: (timestamp: string) => void;
  // Transaction management
  updateTransactions: (transactions: Transaction[]) => void;
  processTransactionData: (transactions: Transaction[]) => void;
  // Savings sheet data management
  updateSavingsSheetData: (savingsData: SavingsSheetData) => void;
  // Currency management
  updateBaseCurrency: (currency: string) => void;
  // Data management
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

export const usePersonalFinanceStore = create<PersonalFinanceState>()(
  persist(
    (set, get) => ({
  userData: {
    income: 0,
    spending: 0,
    savings: 0,
    baseCurrency: 'USD', // Default base currency
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

  updateSpreadsheetInfo: (spreadsheetId: string, spreadsheetUrl: string) => {
    set((state) => ({
      userData: { ...state.userData, spreadsheetId, spreadsheetUrl }
    }));
  },

  updateLastDataRefresh: (timestamp: string) => {
    set((state) => ({
      userData: { ...state.userData, lastDataRefresh: timestamp }
    }));
  },

  updateTransactions: (transactions: Transaction[]) => {
    set((state) => ({
      userData: { ...state.userData, transactions }
    }));
  },

      processTransactionData: (transactions: Transaction[]) => {
        // Only log significant events, not every call to reduce console spam
        if (transactions.length === 0) {
          console.log('🧹 Clearing transaction data');
        } else if (transactions.length > 0) {
          console.log(`📊 Processing ${transactions.length} transactions`);
        }

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

        set((state) => {
          const newUserData = { 
            ...state.userData, 
            transactions,
            categorySpending,
            actualMonthlySpending,
            // Update spending if significantly different or if not set
            spending: state.userData.spending === 0 ? actualMonthlySpending : state.userData.spending
          };
          
          return { userData: newUserData };
        });
      },

      // Savings sheet data management
      updateSavingsSheetData: (savingsData: SavingsSheetData) => {
        set((state) => ({
          userData: { ...state.userData, savingsSheetData: savingsData }
        }));
      },

      // Currency management
      updateBaseCurrency: (currency: string) => {
        set((state) => ({
          userData: { ...state.userData, baseCurrency: currency }
        }));
      },

      // Data management functions
      clearAllData: () => {
        set((state) => ({
          userData: {
            income: 0,
            spending: 0,
            savings: 0,
            baseCurrency: state.userData.baseCurrency || 'USD', // Preserve base currency when clearing
          }
        }));
      },

      exportData: () => {
        const state = get();
        return JSON.stringify(state.userData, null, 2);
      },

      importData: (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          
          // Validate the data structure
          if (typeof parsedData === 'object' && parsedData !== null) {
            set((state) => ({
              userData: {
                ...state.userData,
                ...parsedData,
                // Ensure required fields have default values
                income: parsedData.income || 0,
                spending: parsedData.spending || 0,
                savings: parsedData.savings || 0,
              }
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to import data:', error);
          return false;
        }
      },
    }),
    {
      name: 'personal-finance-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      // Optionally, you can specify which parts of the state to persist
      partialize: (state) => ({
        userData: state.userData,
      }),
      // Version for handling schema migrations in the future
      version: 1,
      // Migration function for handling version updates
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1 if needed
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);

// Export types for use in components
export type { UserData, Transaction, CategorySpending, SavingsBreakdown, SavingsSheetData };