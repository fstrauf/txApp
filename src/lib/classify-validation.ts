import { z } from 'zod';

// Transaction validation schema matching the backend expectations
export const TransactionInputSchema = z.object({
  description: z.string().min(1, 'Description cannot be empty').trim(),
  amount: z.number().finite('Amount must be a valid number'),
  money_in: z.boolean().optional(),
});

export const ClassifyRequestSchema = z.object({
  transactions: z.array(
    z.union([
      z.string().min(1, 'Transaction description cannot be empty'),
      TransactionInputSchema
    ])
  ).min(1, 'At least one transaction is required'),
  user_categories: z.array(z.record(z.string())).optional(),
});

export type ValidatedTransactionInput = z.infer<typeof TransactionInputSchema>;
export type ValidatedClassifyRequest = z.infer<typeof ClassifyRequestSchema>;

/**
 * Validates and formats transaction data for the classify API
 */
export function validateAndFormatTransactions(transactions: any[]): ValidatedTransactionInput[] | string[] {
  return transactions.map((tx, index) => {
    try {
      // If it's already a string, validate and return
      if (typeof tx === 'string') {
        if (!tx.trim()) {
          throw new Error(`Transaction ${index}: Description cannot be empty`);
        }
        return tx.trim();
      }

      // If it's an object, validate and format
      if (typeof tx === 'object' && tx !== null) {
        // Ensure description exists and is a string
        if (!tx.description || typeof tx.description !== 'string') {
          throw new Error(`Transaction ${index}: Missing or invalid description`);
        }

        // Clean and validate description
        const description = tx.description.trim();
        if (!description) {
          throw new Error(`Transaction ${index}: Description cannot be empty`);
        }

        // If amount is provided, validate it
        if (tx.amount !== undefined) {
          let amount: number;
          
          if (typeof tx.amount === 'string') {
            // Try to parse string amount
            const parsed = parseFloat(tx.amount);
            if (isNaN(parsed) || !isFinite(parsed)) {
              throw new Error(`Transaction ${index}: Invalid amount "${tx.amount}" - must be a valid number`);
            }
            amount = parsed;
          } else if (typeof tx.amount === 'number') {
            if (!isFinite(tx.amount)) {
              throw new Error(`Transaction ${index}: Amount must be a finite number`);
            }
            amount = tx.amount;
          } else {
            throw new Error(`Transaction ${index}: Amount must be a number or numeric string`);
          }

          // Return full transaction object
          // Use provided money_in value if available, otherwise fall back to amount sign
          const money_in = tx.money_in !== undefined ? Boolean(tx.money_in) : 
                          tx.is_income !== undefined ? Boolean(tx.is_income) : 
                          amount > 0;
          
          return {
            description,
            amount,
            money_in,
          };
        }

        // Return just the description if no amount
        return description;
      }

      throw new Error(`Transaction ${index}: Invalid transaction format`);
    } catch (error) {
      throw new Error(`Transaction ${index} validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Validates the complete classify request
 */
export function validateClassifyRequest(data: any): ValidatedClassifyRequest {
  try {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      throw new Error('Request body must be an object');
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error('Transactions must be an array');
    }

    if (data.transactions.length === 0) {
      throw new Error('At least one transaction is required');
    }

    // Validate and format transactions
    const validatedTransactions = validateAndFormatTransactions(data.transactions);

    return {
      transactions: validatedTransactions,
      user_categories: data.user_categories || undefined,
    };
  } catch (error) {
    throw new Error(`Request validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handles classify API errors and returns user-friendly messages
 */
export function handleClassifyError(error: any): { message: string; status: number; details?: any } {
  // Handle validation errors
  if (error.message?.includes('validation')) {
    return {
      message: 'Invalid transaction data format. Please check your transaction descriptions and amounts.',
      status: 400,
      details: error.message,
    };
  }

  // Handle encoding/character issues
  if (error.message?.includes('parsing') || error.message?.includes('character')) {
    return {
      message: 'Transaction data contains invalid characters. Please check for special characters or encoding issues.',
      status: 400,
      details: error.message,
    };
  }

  // Handle network/timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return {
      message: 'Classification service is temporarily unavailable. Please try again in a moment.',
      status: 503,
      details: error.message,
    };
  }

  // Generic error
  return {
    message: 'Classification failed. Please check your data and try again.',
    status: 500,
    details: error.message,
  };
} 