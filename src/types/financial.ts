export interface SpendingCategory {
  id: string;
  name: string;
  amount: number; // Monthly spending for this category
}

export interface DebtItem {
  name: string;
  amount: number;
  interestRate?: number; // Optional annual interest rate
}

export interface UserFinancialProfile {
  monthlyNetIncome: number;
  expenses: SpendingCategory[];
  currentSavings: number;
  debts: DebtItem[];
  financialGoals: string[]; // e.g., ['Build Emergency Fund', 'Pay Off Debt']
  demographics?: {
    age?: number;
    lifeStage?: string; // e.g., 'Early Career', 'Mid Career', 'Retired'
  };
}

export interface ExternalLink {
  title: string;
  url: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  actionLabel: string; // e.g., 'Create a Budget', 'Increase Savings'
  priority: 'high' | 'medium' | 'low';
  category: 'Budgeting' | 'Savings' | 'Debt Management' | 'Investing' | 'Other';
  detailedDescription?: string; // Optional detailed information or steps
  externalLinks?: ExternalLink[]; // Optional list of external resource links
  // Potential additional fields: impact, effort, relatedTips
}

export interface FinancialTip {
  id: string;
  title: string;
  content: string;
  category: 'Budgeting' | 'Savings' | 'Debt Management' | 'Investing' | 'Mindset' | 'Other';
  relatedToCategories?: Recommendation['category'][]; // Links tip to recommendation categories
  keywords?: string[]; // For more granular matching
  tags?: string[];
  // Potential additional fields: source, relevanceScore
}
