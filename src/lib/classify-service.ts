import { Transaction, Category } from '@prisma/client';
import { prisma } from './prisma';

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
          const category = await prisma.category.findUnique({
            where: { id: tx.categoryId }
          });
          categoryName = category?.name;
        }
        
        return {
          Narrative: tx.description,
          Category: categoryName || 'Uncategorized',
        };
      })
    );

    const payload = {
      transactions: formattedTransactions,
      expenseSheetId: `user-${Date.now()}`, // Generate a unique ID for this training session
    };

    try {
      const response = await this.fetchWithAuth('/train', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response as TrainingResponse;
    } catch (error) {
      console.error('Error training model:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Classify a set of transactions
   */
  async classifyTransactions(
    transactions: Transaction[],
    trainingId: string
  ): Promise<ClassificationResponse> {
    // Convert transactions to the format expected by the classification service
    const formattedTransactions = transactions.map(tx => ({
      Narrative: tx.description,
    }));

    const payload = {
      transactions: formattedTransactions,
      spreadsheetId: trainingId,
    };

    try {
      const response = await this.fetchWithAuth('/classify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response as ClassificationResponse;
    } catch (error) {
      console.error('Error classifying transactions:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check the status of a prediction
   */
  async getPredictionStatus(predictionId: string): Promise<PredictionStatusResponse> {
    try {
      const response = await this.fetchWithAuth(`/status/${predictionId}`);
      return response as PredictionStatusResponse;
    } catch (error) {
      console.error('Error checking prediction status:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth('/health');
      return response.status === 'healthy';
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
} 