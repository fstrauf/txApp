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
        
        // Check if string looks like a CSV header
        const headerPatterns = ['description', 'narrative', 'merchant', 'amount', 'date', 'reference'];
        const lowerTx = tx.toLowerCase().trim();
        if (headerPatterns.some(pattern => lowerTx === pattern)) {
          throw new Error(`Transaction ${index}: "${tx}" appears to be a CSV header rather than transaction data. Please check your CSV file format and ensure headers are properly skipped.`);
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
        
        // Check if description looks like a header
        const headerPatterns = ['description', 'narrative', 'merchant', 'reference', 'details', 'memo'];
        if (headerPatterns.some(pattern => description.toLowerCase() === pattern)) {
          throw new Error(`Transaction ${index}: Description "${description}" appears to be a CSV header. This suggests your CSV file contains header rows that should be skipped or your column mapping is incorrect.`);
        }

        // If amount is provided, validate it
        if (tx.amount !== undefined) {
          let amount: number;
          
          if (typeof tx.amount === 'string') {
            // Check if string looks like a description rather than a number
            if (tx.amount.toLowerCase().includes('description') || 
                tx.amount.toLowerCase().includes('narrative') ||
                tx.amount.toLowerCase().includes('merchant') ||
                /^[a-zA-Z\s]+$/.test(tx.amount.trim())) {
              throw new Error(`Transaction ${index}: Amount field contains text "${tx.amount}" instead of a number. This suggests incorrect column mapping in your CSV upload.`);
            }
            
            // Check if amount field contains the same value as description (duplicate mapping)
            if (tx.amount === tx.description) {
              throw new Error(`Transaction ${index}: Amount and Description fields contain the same value "${tx.amount}". This indicates you may have mapped the same CSV column to multiple fields. Please check your column mapping.`);
            }
            
            // Try to parse string amount
            const parsed = parseFloat(tx.amount);
            if (isNaN(parsed) || !isFinite(parsed)) {
              throw new Error(`Transaction ${index}: Invalid amount "${tx.amount}" - must be a valid number. Check your CSV column mapping.`);
            }
            amount = parsed;
          } else if (typeof tx.amount === 'number') {
            if (!isFinite(tx.amount)) {
              throw new Error(`Transaction ${index}: Amount must be a finite number`);
            }
            amount = tx.amount;
          } else {
            throw new Error(`Transaction ${index}: Amount must be a number or numeric string, got ${typeof tx.amount}`);
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
 * Pre-validation to catch common CSV mapping issues
 */
export function validateCsvMappingData(transactions: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < Math.min(transactions.length, 5); i++) {
    const tx = transactions[i];
    
    if (typeof tx === 'object' && tx !== null) {
      // Check for common header text patterns
      const headerPatterns = [
        'description', 'narrative', 'merchant', 'reference', 'details', 'memo',
        'amount', 'value', 'sum', 'total', 'balance', 'debit', 'credit',
        'date', 'time', 'timestamp', 'when', 'transaction_date',
        'type', 'category', 'code', 'status', 'direction'
      ];
      
      // Check if description field looks like a header
      if (tx.description) {
        const descStr = String(tx.description).toLowerCase().trim();
        if (headerPatterns.some(pattern => descStr === pattern)) {
          errors.push(`Row ${i + 1}: Description field "${tx.description}" appears to be a CSV header. This suggests the CSV file contains header rows that should be skipped.`);
        }
      }
      
      // Check for common mapping mistakes
      if (tx.amount !== undefined) {
        const amountStr = String(tx.amount).toLowerCase().trim();
        
        // Check if amount field contains header text
        if (headerPatterns.some(pattern => amountStr === pattern)) {
          errors.push(`Row ${i + 1}: Amount field contains "${tx.amount}" which appears to be a CSV header. Please check your column mapping - the same column may be mapped to multiple fields.`);
        }
        
        // Check if amount field contains description-like text
        if (amountStr.includes('description') ||
            amountStr.includes('narrative') ||
            amountStr.includes('merchant') ||
            amountStr.includes('reference') ||
            /^[a-zA-Z\s]{3,}$/.test(amountStr)) {
          errors.push(`Row ${i + 1}: Amount field contains "${amountStr}" which looks like a description. Please check your column mapping.`);
        }
        
        // Check if amount is not a valid number
        const parsed = parseFloat(amountStr);
        if (isNaN(parsed)) {
          errors.push(`Row ${i + 1}: Amount "${amountStr}" is not a valid number. Please check your column mapping.`);
        }
      }
      
      // Check if description contains only numbers (might be wrong mapping)
      if (tx.description && /^\d+\.?\d*$/.test(String(tx.description).trim())) {
        errors.push(`Row ${i + 1}: Description "${tx.description}" appears to be a number. Please check your column mapping.`);
      }
      
      // Check for duplicate field mappings (same value in multiple fields)
      if (tx.description && tx.amount && String(tx.description) === String(tx.amount)) {
        errors.push(`Row ${i + 1}: Description and Amount fields contain the same value "${tx.description}". This indicates incorrect column mapping - you may have mapped the same CSV column to multiple fields.`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

    // Pre-validate CSV mapping issues
    const mappingValidation = validateCsvMappingData(data.transactions);
    if (!mappingValidation.isValid) {
      throw new Error(`Column mapping issues detected:\n${mappingValidation.errors.join('\n')}`);
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
  if (error.message?.includes('validation') || error.message?.includes('mapping')) {
    return {
      message: 'Data mapping error: Please check your CSV column mapping and ensure amounts are mapped to numeric columns and descriptions to text columns.',
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