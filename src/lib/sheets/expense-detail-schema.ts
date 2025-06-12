/**
 * Centralized schema for Google Sheets Expense-Detail sheet
 * This ensures consistency between reading and writing operations
 */

export interface ExpenseDetailRow {
  source: string;          // Column A
  date: string;           // Column B (DD/MM/YYYY format for Google Sheets)
  narrative: string;      // Column C (description)
  amountSpent: number;    // Column D (original amount - may contain signed amounts)
  category: string;       // Column E
  currencySpent: string;  // Column F (original currency)
  amountInBaseCurrency: number; // Column G (converted amount)
}

export interface ExpenseDetailTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  baseCurrency?: string;
  category: string;
  account: string;
  isDebit: boolean;
  confidence?: number;
  [key: string]: any;
}

// Column configuration for Expense-Detail sheet
export const EXPENSE_DETAIL_SCHEMA = {
  // Sheet name
  sheetName: 'Expense-Detail',
  
  // Column mappings (0-based index)
  columns: {
    source: 0,               // A
    date: 1,                 // B
    narrative: 2,            // C
    amountSpent: 3,          // D (original amount)
    category: 4,             // E
    currencySpent: 5,        // F (original currency)
    amountInBaseCurrency: 6, // G (converted amount)
  } as const,
  
  // Expected headers (must match exactly)
  headers: [
    'Source',
    'Date', 
    'Narrative',
    'Amount Spent',
    'Category',
    'Currency Spent',
    'Amount in Base Currency'
  ] as const,
  
  // Range for operations
  ranges: {
    // For reading all data including headers
    readAll: 'Expense-Detail!A:G',
    // For writing data (append operations)
    writeData: 'Expense-Detail!A:G',
    // For clearing data (keeping headers)
    clearData: 'Expense-Detail!A2:G',
    // Headers only
    headers: 'Expense-Detail!A1:G1',
  } as const,
  
} as const;

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY for Google Sheets
 */
function formatDateForSheet(dateString: string): string {
  try {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Error formatting date for sheet:', dateString, error);
    return dateString; // Fallback to original
  }
}

/**
 * Convert internal transaction to Expense-Detail row format
 */
export function transactionToExpenseDetailRow(transaction: ExpenseDetailTransaction): (string | number)[] {
  // Original amount (column D) - use originalAmount if available, otherwise amount
  const originalAmount = transaction.originalAmount || transaction.amount;
  const signedOriginalAmount = transaction.isDebit ? -Math.abs(originalAmount) : Math.abs(originalAmount);
  
  // Base currency amount (column G) - always use the amount field (converted)
  const signedBaseCurrencyAmount = transaction.isDebit ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
  
  // Use dynamic currencies from transaction data, with fallbacks
  const originalCurrency = transaction.originalCurrency || transaction.baseCurrency || 'USD';
  
  return [
    'ExpenseSorted Import',                    // Source (A)
    formatDateForSheet(transaction.date),      // Date (B) - formatted as DD/MM/YYYY
    transaction.description,                   // Narrative (C) 
    signedOriginalAmount,                      // Amount Spent (D) - original amount with sign
    transaction.category,                      // Category (E)
    originalCurrency,                          // Currency Spent (F) - original currency (dynamic)
    signedBaseCurrencyAmount,                  // Amount in Base Currency (G) - converted amount with sign
  ];
}

/**
 * Convert multiple transactions to rows for batch operations
 */
export function transactionsToExpenseDetailRows(transactions: ExpenseDetailTransaction[]): (string | number)[][] {
  return transactions.map(transactionToExpenseDetailRow);
}

/**
 * Parse Expense-Detail row data to internal transaction format
 */
export function expenseDetailRowToTransaction(
  row: (string | number)[], 
  index: number,
  spreadsheetId: string,
  defaultBaseCurrency: string = 'USD'
): ExpenseDetailTransaction | null {
  // Skip empty rows
  if (!row || row.length === 0 || row.every(cell => !cell)) {
    return null;
  }

  const source = String(row[EXPENSE_DETAIL_SCHEMA.columns.source] || '').trim();
  const rawDate = row[EXPENSE_DETAIL_SCHEMA.columns.date];
  const narrative = String(row[EXPENSE_DETAIL_SCHEMA.columns.narrative] || '').trim();
  const rawOriginalAmount = row[EXPENSE_DETAIL_SCHEMA.columns.amountSpent]; // Column D (original amount)
  const category = String(row[EXPENSE_DETAIL_SCHEMA.columns.category] || '').trim();
  const originalCurrency = String(row[EXPENSE_DETAIL_SCHEMA.columns.currencySpent] || defaultBaseCurrency).trim(); // Column F
  const rawBaseCurrencyAmount = row[EXPENSE_DETAIL_SCHEMA.columns.amountInBaseCurrency]; // Column G (converted amount)

  // Skip rows with missing essential data - use base currency amount for processing
  const primaryAmount = rawBaseCurrencyAmount || rawOriginalAmount; // Prefer converted amount, fallback to original
  if (!narrative || !primaryAmount || !category) {
    return null;
  }

  // Parse date
  let parsedDate: string;
  try {
    if (typeof rawDate === 'number') {
      // Excel serial date number
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (rawDate - 2) * 24 * 60 * 60 * 1000);
      parsedDate = date.toISOString().split('T')[0];
    } else if (typeof rawDate === 'string') {
      let date: Date;
      
      // Handle DD/MM/YYYY format (user's preferred format)
      if (rawDate.includes('/') && rawDate.split('/').length === 3) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          
          // Validate the date parts
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
              day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
            date = new Date(year, month, day);
          } else {
            throw new Error('Invalid DD/MM/YYYY date parts');
          }
        } else {
          throw new Error('Invalid DD/MM/YYYY format');
        }
      } else {
        // Try standard date parsing for other formats
        date = new Date(rawDate);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', rawDate);
        return null;
      }
      parsedDate = date.toISOString().split('T')[0];
    } else {
      console.warn('Unsupported date format:', rawDate);
      return null;
    }
  } catch (error) {
    console.warn('Error parsing date:', rawDate, error);
    return null;
  }

  // Parse amount - prefer base currency amount (column G), fallback to original (column D)
  let parsedAmount: number;
  let parsedOriginalAmount: number | undefined;
  try {
    // Parse the primary amount for processing (base currency amount preferred)
    if (typeof primaryAmount === 'number') {
      parsedAmount = primaryAmount;
    } else if (typeof primaryAmount === 'string') {
      // Remove currency symbols and parse
      const cleanAmount = primaryAmount.replace(/[$,]/g, '');
      parsedAmount = parseFloat(cleanAmount);
    } else {
      console.warn('Unsupported amount format:', primaryAmount);
      return null;
    }

    if (isNaN(parsedAmount)) {
      console.warn('Invalid amount value:', primaryAmount);
      return null;
    }

    // Parse original amount if different from primary
    if (rawOriginalAmount && rawOriginalAmount !== primaryAmount) {
      if (typeof rawOriginalAmount === 'number') {
        parsedOriginalAmount = rawOriginalAmount;
      } else if (typeof rawOriginalAmount === 'string') {
        const cleanOriginalAmount = rawOriginalAmount.replace(/[$,]/g, '');
        parsedOriginalAmount = parseFloat(cleanOriginalAmount);
      }
    }
  } catch (error) {
    console.warn('Error parsing amount:', primaryAmount, error);
    return null;
  }

  return {
    id: `sheet-${spreadsheetId}-${index + 2}`, // +2 because row 1 is headers and we're 0-indexed
    date: parsedDate,
    description: narrative,
    amount: Math.abs(parsedAmount), // Always store as positive (converted base currency amount)
    originalAmount: parsedOriginalAmount ? Math.abs(parsedOriginalAmount) : undefined, // Original amount if different
    originalCurrency: originalCurrency, // Original currency from column F
    baseCurrency: defaultBaseCurrency, // Dynamic base currency
    category: category,
    account: source || 'Unknown',
    isDebit: parsedAmount < 0, // Negative amounts are debits (expenses), positive amounts are credits (income)
    confidence: 1.0, // Data from sheet is considered validated
  };
}

/**
 * Parse multiple rows from Expense-Detail sheet
 */
export function parseExpenseDetailRows(
  rows: (string | number)[][],
  spreadsheetId: string,
  defaultBaseCurrency: string = 'USD'
): ExpenseDetailTransaction[] {
  if (!rows || rows.length < 2) {
    return [];
  }

  // Skip header row (index 0) and parse data rows
  const dataRows = rows.slice(1);
  const transactions: ExpenseDetailTransaction[] = [];

  dataRows.forEach((row, index) => {
    const transaction = expenseDetailRowToTransaction(row, index, spreadsheetId, defaultBaseCurrency);
    if (transaction) {
      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Validate that sheet headers match expected format
 */
export function validateExpenseDetailHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!headers || headers.length === 0) {
    return { isValid: false, errors: ['No headers found'] };
  }

  EXPENSE_DETAIL_SCHEMA.headers.forEach((expectedHeader, index) => {
    const actualHeader = headers[index]?.trim();
    
    // Special case for "Amount in Base Currency" - allow with currency suffix
    if (expectedHeader === 'Amount in Base Currency') {
      if (!actualHeader || (!actualHeader.startsWith('Amount in Base Currency'))) {
        errors.push(`Column ${String.fromCharCode(65 + index)} should start with "${expectedHeader}" but found "${actualHeader || 'empty'}"`);
      }
    } else {
      // Exact match for other headers
      if (actualHeader !== expectedHeader) {
        errors.push(`Column ${String.fromCharCode(65 + index)} should be "${expectedHeader}" but found "${actualHeader || 'empty'}"`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Filter transactions to only include recent data (last 12 months by default)
 */
export function filterRecentTransactions(
  transactions: ExpenseDetailTransaction[], 
  monthsBack: number = 12
): ExpenseDetailTransaction[] {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
  const cutoffString = cutoffDate.toISOString().split('T')[0];

  return transactions.filter(t => t.date >= cutoffString);
}

/**
 * Sort transactions by date (newest first)
 */
export function sortTransactionsByDate(transactions: ExpenseDetailTransaction[]): ExpenseDetailTransaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
} 