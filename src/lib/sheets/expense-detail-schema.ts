/**
 * Centralized schema for Google Sheets Expense-Detail sheet
 * This ensures consistency between reading and writing operations
 */

export interface ExpenseDetailRow {
  source: string;          // Column A
  date: string;           // Column B (YYYY-MM-DD format)
  narrative: string;      // Column C (description)
  amountSpent: number;    // Column D (may contain signed amounts)
  category: string;       // Column E
}

export interface ExpenseDetailTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
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
    source: 0,      // A
    date: 1,        // B
    narrative: 2,   // C
    amountSpent: 3, // D
    category: 4,    // E
  } as const,
  
  // Expected headers (must match exactly)
  headers: [
    'Source',
    'Date', 
    'Narrative',
    'Amount Spent',
    'Category'
  ] as const,
  
  // Range for operations
  ranges: {
    // For reading all data including headers
    readAll: 'Expense-Detail!A:E',
    // For writing data (append operations)
    writeData: 'Expense-Detail!A:E',
    // For clearing data (keeping headers)
    clearData: 'Expense-Detail!A2:E',
    // Headers only
    headers: 'Expense-Detail!A1:E1',
  } as const,
  
} as const;

/**
 * Convert internal transaction to Expense-Detail row format
 */
export function transactionToExpenseDetailRow(transaction: ExpenseDetailTransaction): (string | number)[] {
  // For 5-column format, use signed amount in column D
  const signedAmount = transaction.isDebit ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
  
  return [
    'ExpenseSorted Import',                    // Source (A)
    transaction.date,                          // Date (B)
    transaction.description,                   // Narrative (C) 
    signedAmount,                              // Amount Spent (D) - signed (negative for expenses, positive for income)
    transaction.category,                      // Category (E)
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
  spreadsheetId: string
): ExpenseDetailTransaction | null {
  // Skip empty rows
  if (!row || row.length === 0 || row.every(cell => !cell)) {
    return null;
  }

  const source = String(row[EXPENSE_DETAIL_SCHEMA.columns.source] || '').trim();
  const rawDate = row[EXPENSE_DETAIL_SCHEMA.columns.date];
  const narrative = String(row[EXPENSE_DETAIL_SCHEMA.columns.narrative] || '').trim();
  const rawAmount = row[EXPENSE_DETAIL_SCHEMA.columns.amountSpent];
  const category = String(row[EXPENSE_DETAIL_SCHEMA.columns.category] || '').trim();

  // Skip rows with missing essential data
  if (!narrative || !rawAmount || !category) {
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
      const date = new Date(rawDate);
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

  // Parse amount from column D (Amount Spent)
  let parsedAmount: number;
  try {
    if (typeof rawAmount === 'number') {
      parsedAmount = rawAmount;
    } else if (typeof rawAmount === 'string') {
      // Remove currency symbols and parse
      const cleanAmount = rawAmount.replace(/[$,]/g, '');
      parsedAmount = parseFloat(cleanAmount);
    } else {
      console.warn('Unsupported amount format:', rawAmount);
      return null;
    }

    if (isNaN(parsedAmount)) {
      console.warn('Invalid amount value:', rawAmount);
      return null;
    }
  } catch (error) {
    console.warn('Error parsing amount:', rawAmount, error);
    return null;
  }

  return {
    id: `sheet-${spreadsheetId}-${index + 2}`, // +2 because row 1 is headers and we're 0-indexed
    date: parsedDate,
    description: narrative,
    amount: Math.abs(parsedAmount), // Always store as positive
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
  spreadsheetId: string
): ExpenseDetailTransaction[] {
  if (!rows || rows.length < 2) {
    return [];
  }

  // Skip header row (index 0) and parse data rows
  const dataRows = rows.slice(1);
  const transactions: ExpenseDetailTransaction[] = [];

  dataRows.forEach((row, index) => {
    const transaction = expenseDetailRowToTransaction(row, index, spreadsheetId);
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
    if (actualHeader !== expectedHeader) {
      errors.push(`Column ${String.fromCharCode(65 + index)} should be "${expectedHeader}" but found "${actualHeader || 'empty'}"`);
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