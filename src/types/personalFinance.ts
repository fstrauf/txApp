export interface SavingsBreakdown {
  everyday: number;
  termDeposits: number;
  investments: number;
  kiwiSaver: number;
}

export interface CSVTransactionCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CSVTransactionTrend {
  month: string;
  amount: number;
}

export interface CSVData {
  transactions: number;
  categories: CSVTransactionCategory[];
  trends: CSVTransactionTrend[];
}

export interface UserData {
  income: number;
  spending: number;
  savings: number;
  goal: string; // Consider a more specific type if goals are predefined
  csvData: CSVData | null;
  savingsBreakdown: SavingsBreakdown;
}

export const initialUserData: UserData = {
  income: 0,
  spending: 0,
  savings: 0,
  goal: '',
  csvData: null,
  savingsBreakdown: {
    everyday: 0,
    termDeposits: 0,
    investments: 0,
    kiwiSaver: 0,
  },
};

// Define types for screen names/IDs for better type safety
export type ScreenId =
  | 'welcome' // screen1
  | 'income' // screen2
  | 'spending' // screen3
  | 'savings' // screen4
  | 'initialInsights' // screen5 - This will be our main results screen
  | 'goalPlanning' // screen6 (also used by goToGoalsPlanning)
  | 'finalSummary' // screen7 (jumpToEnd target)
  | 'spendingAnalysisUpload' // screen8
  | 'spendingAnalysisResults' // screen9
  | 'savingsAnalysisInput' // screen10
  | 'savingsAnalysisResults' // screen11
  | 'complete'; // screen12 (example, not explicitly in HTML but good for end state)

export const TOTAL_SCREENS_MAIN_FLOW = 7; // Approximate total for progress bar (Welcome to Final Summary)
