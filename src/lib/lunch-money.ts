import { Transaction as PrismaTransaction } from '@prisma/client';

// Extend the Transaction type to include Lunch Money fields
interface Transaction extends PrismaTransaction {
  lunchMoneyId?: string;
  lunchMoneyCategory?: string;
  isTrainingData?: boolean;
  predictedCategory?: string;
  similarityScore?: number;
}

interface LunchMoneyTransaction {
  id: number;
  date: string;
  payee: string;
  amount: number;
  currency: string;
  notes: string | null;
  category_id: number | null;
  category_name: string | null;
  asset_id: number | null;
  asset_name: string | null;
  plaid_account_id: number | null;
  status: string;
  is_group: boolean;
  group_id: number | null;
  parent_id: number | null;
  tags: string[];
  external_id: string | null;
  original_name: string | null;
  recurring_id: number | null;
  fee_id: number | null;
}

interface LunchMoneyCategory {
  id: number;
  name: string;
  description: string | null;
  is_income: boolean;
  exclude_from_budget: boolean;
  exclude_from_totals: boolean;
  updated_at: string;
  created_at: string;
  is_group: boolean;
  group_id: number | null;
}

interface TransactionsResponse {
  transactions: LunchMoneyTransaction[];
}

interface CategoriesResponse {
  categories: LunchMoneyCategory[];
}

export class LunchMoneyClient {
  private apiKey: string;
  private baseUrl = 'https://dev.lunchmoney.app/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lunch Money API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getTransactions(
    start_date?: string,
    end_date?: string,
    limit = 100
  ): Promise<LunchMoneyTransaction[]> {
    // Default to the last 30 days if no dates are provided
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const params = new URLSearchParams({
      start_date: start_date || thirtyDaysAgo.toISOString().split('T')[0],
      end_date: end_date || now.toISOString().split('T')[0],
      limit: limit.toString(),
    });

    const response = await this.fetchWithAuth(`/transactions?${params.toString()}`);
    return (response as TransactionsResponse).transactions;
  }

  async getCategories(): Promise<LunchMoneyCategory[]> {
    const response = await this.fetchWithAuth('/categories');
    return (response as CategoriesResponse).categories;
  }

  // Helper to convert Lunch Money transactions to our app's Transaction format
  static convertToAppTransaction(
    lmTransaction: LunchMoneyTransaction,
    userId: string,
    bankAccountId: string
  ): Partial<Transaction> {
    return {
      date: new Date(lmTransaction.date),
      description: lmTransaction.payee,
      amount: Math.abs(lmTransaction.amount),
      type: lmTransaction.amount < 0 ? 'expense' : 'income',
      userId,
      bankAccountId,
      lunchMoneyId: lmTransaction.id.toString(),
      lunchMoneyCategory: lmTransaction.category_name || undefined,
      notes: lmTransaction.notes || undefined,
    };
  }
} 