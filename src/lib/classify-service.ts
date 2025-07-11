import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Define transaction types for the application
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: string | number;
  type: string;
  is_income?: boolean;
  bankAccountId: string;
  categoryId: string | null;
  userId: string;
  isReconciled: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  classificationJobId?: string | null;
  isTrainingData?: boolean;
  lunchMoneyCategory?: string | null;
  lunchMoneyId?: string | null;
  predictedCategory?: string | null;
  similarityScore?: string | null;
  trainingJobId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionWithCategory extends Transaction {
  category?: Category | null;
}

interface ClassifyServiceConfig {
  apiKey: string;
  serviceUrl: string;
}

interface TrainingResponse {
  status: string;
  prediction_id?: string;
  error?: string;
}

interface ClassificationResponse {
  status: string;
  prediction_id?: string;
  error?: string;
}

interface PredictionStatusResponse {
  status: string;
  message?: string;
  error?: string;
  results?: Array<{
    predicted_category: string;
    similarity_score: number;
    narrative: string;
  }>;
}

export class ClassifyServiceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ClassifyServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.serviceUrl || 'http://localhost:5001';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Classification service error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Train the classification model with a set of transactions
   */
  async trainModel(transactions: TransactionWithCategory[]): Promise<TrainingResponse> {
    // Convert transactions to the format expected by the classification service
    const formattedTransactions = await Promise.all(
      transactions.map(async tx => {
        // If category is already included, use it directly
        let categoryName = tx.category?.name;
        
        // If not included, fetch it if categoryId exists
        if (!categoryName && tx.categoryId) {
          const categoryResults = await db
            .select()
            .from(categories)
            .where(eq(categories.id, tx.categoryId))
            .limit(1);
          
          if (categoryResults.length > 0) {
            categoryName = categoryResults[0].name;
          }
        }
        
        // Determine if this is income based on is_income flag first, then fall back to type or amount
        const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
        // Use is_income explicitly if available, otherwise fall back to type/amount
        const isIncome = tx.is_income !== undefined ? tx.is_income : 
                         tx.type === 'income' || amount > 0;
        
        return {
          Narrative: tx.description,
          Category: categoryName || 'Uncategorized',
          money_in: isIncome,
        };
      })
    );

    const payload = {
      transactions: formattedTransactions,
      expenseSheetId: `user-${Date.now()}`, // Generate a unique ID for this training session
    };

    const response = await this.fetchWithAuth('/train', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response as TrainingResponse;
  }

  /**
   * Classify a set of transactions
   */
  async classifyTransactions(
    transactions: Transaction[],
    trainingId: string
  ): Promise<ClassificationResponse> {
    // Convert transactions to the format expected by the classification service
    const formattedTransactions = transactions.map(tx => {
      // Determine if this is income based on is_income flag first, then fall back to type or amount
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      // Use is_income explicitly if available, otherwise fall back to type/amount
      const isIncome = tx.is_income !== undefined ? tx.is_income : 
                      tx.type === 'income' || amount > 0;
      
      return {
        Narrative: tx.description,
        money_in: isIncome,
      };
    });

    const payload = {
      transactions: formattedTransactions,
      spreadsheetId: trainingId,
    };

    const response = await this.fetchWithAuth('/classify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response as ClassificationResponse;
  }

  /**
   * Check the status of a prediction
   */
  async getPredictionStatus(predictionId: string): Promise<PredictionStatusResponse> {
    const response = await this.fetchWithAuth(`/status/${predictionId}`);
    return response as PredictionStatusResponse;
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    const response = await this.fetchWithAuth('/health');
    return response.status === 'healthy';
  }
} 