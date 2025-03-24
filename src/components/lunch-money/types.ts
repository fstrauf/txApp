// Define the shared types used across lunch-money components

// Transaction type definition
export type Transaction = {
  id?: string;
  date: string | Date;
  description: string;
  amount: number;
  is_income: boolean;
  lunchMoneyId: string;
  lunchMoneyCategory?: string | null;
  notes?: string;
  category?: string | null;
  isTrainingData?: boolean;
  predictedCategory?: string;
  similarityScore?: number;
  originalData?: any;
  tags?: Array<string | { name: string; id: string }>;
};

// Category type definition
export type Category = {
  id: string;
  name: string;
  description: string;
  isLunchMoneyCategory: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
  isIncome: boolean;
};

// Date range type for filtering
export type DateRange = {
  startDate: string;
  endDate: string;
};

// Toast notification message type
export type ToastMessage = {
  message: string;
  type: 'success' | 'error';
};

// Import status type
export type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

// Operation type for progress indication
export type OperationType = 'none' | 'training' | 'categorizing'; 