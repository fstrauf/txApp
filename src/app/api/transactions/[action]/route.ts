import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { z } from 'zod';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { parse } from 'date-fns';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

// --- Zod Schemas (Copied from Hono route) ---
const importConfigSchema = z.object({
  bankAccountId: z.string().uuid('Bank Account ID must be a valid UUID'),
  mappings: z.object({
    date: z.string().min(1, 'Date column mapping is required'),
    amount: z.string().min(1, 'Amount column mapping is required'),
    description: z.string().min(1, 'Description column mapping is required'),
    currency: z.string().optional(),
  }),
  dateFormat: z.string().min(1, 'Date format is required (e.g., YYYY-MM-DD)'),
  amountFormat: z.enum(['standard', 'negate', 'sign_column'], {
    errorMap: () => ({ message: 'Invalid amount format specified' })
  }),
  signColumn: z.string().optional(),
  skipRows: z.number().int().min(0).default(0),
  delimiter: z.string().optional(),
}).refine(data => data.amountFormat !== 'sign_column' || (data.amountFormat === 'sign_column' && data.signColumn), {
  message: "Sign column mapping is required when amount format is 'sign_column'",
  path: ["signColumn"],
});
type ImportConfig = z.infer<typeof importConfigSchema>;

// --- Helper Functions (Copied from Hono route) ---
/*
function parseDate(dateStr: string, format: string): Date | null {
   const cleanedFormat = format.toUpperCase().replace(/[^YMD]/g, ' ');
  const cleanedDateStr = dateStr.replace(/[^0-9]/g, ' ');
  const formatParts = cleanedFormat.split(' ').filter(p => p);
  const dateParts = cleanedDateStr.split(' ').filter(p => p);
  if (formatParts.length !== dateParts.length) return null;
  let year = 1970, month = 0, day = 1;
  for (let i = 0; i < formatParts.length; i++) {
      const part = parseInt(dateParts[i], 10);
      if (isNaN(part)) return null;
      if (formatParts[i].includes('Y')) year = part;
      else if (formatParts[i].includes('M')) month = part - 1;
      else if (formatParts[i].includes('D')) day = part;
  }
  if (year < 1900 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month, day)); 
  if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}
*/

// --- POST Handler ---
export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const { action } = await params;

  // --- Authentication Check ---
  const session = await getServerSession(authConfig);
  
  // Allow unauthenticated access for analyze and categorize actions (demo purposes)
  if (!['categorize', 'analyze'].includes(action) && !session?.user?.id) {
    console.log(`[API /transactions/${action}] Unauthorized access attempt.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // For import action that requires DB access, userId is required
  const userId = session?.user?.id;
  if (action === 'import' && !userId) {
    console.log(`[API /transactions/${action}] Missing user ID for authenticated action.`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // --- Analyze Action ---
  if (action === 'analyze') {
    console.log(`>>> [API /transactions/analyze] Handling POST`);
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
      }
      const fileText = await file.text();
      let headers: string[] = [];
      let previewRows: any[] = [];
      let rowCount = 0;
      const PREVIEW_ROW_COUNT = 5;
      Papa.parse(fileText, {
        header: true, skipEmptyLines: true, preview: PREVIEW_ROW_COUNT,
        step: (results) => {
          if (rowCount === 0) { headers = results.meta.fields || []; }
          if (rowCount < PREVIEW_ROW_COUNT) { previewRows.push(results.data); }
          rowCount++;
        },
        complete: () => {},
        error: (error: Error) => { throw new Error('Failed to parse CSV file: ' + error.message); }
      });
      return NextResponse.json({
        headers,
        previewRows,
        detectedDelimiter: Papa.parse(fileText, { preview: 1 }).meta.delimiter || ',',
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      return NextResponse.json({ error: error.message || 'Failed to analyze CSV file' }, { status: 500 });
    }
  }

  // --- Import Action ---
  if (action === 'import') {
    console.log(`>>> [API /transactions/import] Handling POST for user: ${userId}`);
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const configString = formData.get('config');
      if (!file || !(file instanceof File)) { return NextResponse.json({ error: 'CSV file is required' }, { status: 400 }); }
      if (!configString || typeof configString !== 'string') { return NextResponse.json({ error: 'Import configuration is required' }, { status: 400 }); }

      let config: ImportConfig;
      try {
        const parsedConfig = JSON.parse(configString);
        config = importConfigSchema.parse(parsedConfig);
      } catch (error) {
        const message = error instanceof z.ZodError ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : 'Invalid configuration format';
        return NextResponse.json({ error: `Configuration Error: ${message}` }, { status: 400 });
      }
      
      const fileText = await file.text();
      const results: any[] = [];
      let parseError = false;
      Papa.parse(fileText, {
         header: true, skipEmptyLines: true, delimiter: config.delimiter, dynamicTyping: true, transformHeader: header => header.trim(),
        complete: (parsedResults) => { if (parsedResults.errors.length > 0) { console.error("CSV Parsing Errors:", parsedResults.errors); parseError = true; return; } results.push(...parsedResults.data); },
        error: (error: Error) => { console.error('Critical CSV parsing error:', error); parseError = true; }
      });
      if (parseError) { return NextResponse.json({ error: 'Failed to parse CSV file. Check format and delimiter.' }, { status: 400 }); }

      const requiredColumns = Object.values(config.mappings).filter(Boolean) as string[];
      if (config.amountFormat === 'sign_column' && config.signColumn) { requiredColumns.push(config.signColumn); }
      const firstRow = results[0] || {};
      const parsedHeaders = Object.keys(firstRow);
      const missingColumns = requiredColumns.filter(col => !parsedHeaders.includes(col));
      if (missingColumns.length > 0) { return NextResponse.json({ error: `Missing required columns in CSV: ${missingColumns.join(', ')}` }, { status: 400 }); }
      
      const preparedTransactions = [];
      const processingErrors: { row: number; error: string; data: any }[] = [];
      const referenceDate = new Date();

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowIndex = i + config.skipRows + 1; 
        try {
          const dateStr = row[config.mappings.date];
          const amountRaw = row[config.mappings.amount];
          const description = row[config.mappings.description]?.toString() || '';
          if (dateStr === undefined || amountRaw === undefined || description === '') { throw new Error('Missing essential data'); }
          
          // Log the received date string and format string for debugging
          console.log(`Attempting to parse date: '${dateStr}' with format: '${config.dateFormat}'`);
          
          const date = parse(dateStr.toString(), config.dateFormat, referenceDate);

          if (!date || isNaN(date.getTime())) {
            // Include the format string in the error message for clarity
            throw new Error(`Invalid date format for value '${dateStr}' using format '${config.dateFormat}'`); 
          }
          
          let amount = typeof amountRaw === 'string' ? parseFloat(amountRaw.replace(/[^0-9.-]+/g, '')) : Number(amountRaw);
          if (isNaN(amount)) { throw new Error(`Invalid amount format for value '${amountRaw}'`); }
          if (config.amountFormat === 'negate') { amount = -Math.abs(amount); }
           else if (config.amountFormat === 'sign_column' && config.signColumn) {
            const signValue = row[config.signColumn]?.toString().toUpperCase();
            if (signValue === 'D' || signValue === 'DEBIT' || signValue === 'AUSGABE') { amount = -Math.abs(amount); } 
            else { amount = Math.abs(amount); }
          }
          const transactionData = {
            id: uuidv4(), userId: userId!, bankAccountId: config.bankAccountId, date: date, description: description.trim(), amount: String(amount.toFixed(2)), type: amount >= 0 ? 'credit' : 'debit',
            categoryId: null, notes: null, lunchMoneyCategory: null, lunchMoneyId: null, isReconciled: false, isTrainingData: false,
          };
          preparedTransactions.push(transactionData);
        } catch (error: any) { processingErrors.push({ row: rowIndex, error: error.message, data: row }); }
      }
      if (processingErrors.length > 0) { return NextResponse.json({ error: `Failed to process ${processingErrors.length} rows.`, details: processingErrors.slice(0, 10) }, { status: 400 }); }
      if (preparedTransactions.length === 0) { return NextResponse.json({ message: 'No valid transactions found to import.' }); }

      const result = await db.insert(transactions).values(preparedTransactions).returning({ id: transactions.id });
      return NextResponse.json({ message: `Successfully imported ${result.length} transactions.`, count: result.length });

    } catch (error: any) {
      console.error('Import endpoint error:', error);
      return NextResponse.json({ error: error.message || 'Failed to import transactions' }, { status: 500 });
    }
  }

  // --- Categorize Action ---
  if (action === 'categorize') {
    console.log(`>>> [API /transactions/categorize] Handling POST for user: ${userId || 'unauthenticated'}`);
    try {
      const body = await request.json();
      const { transactions: transactionData } = body;

      if (!transactionData || !Array.isArray(transactionData)) {
        return NextResponse.json({ error: 'Transactions array is required' }, { status: 400 });
      }

      // Format transactions for the categorization service
      const formattedTransactions = transactionData.map((tx: any) => ({
        description: tx.description,
        money_in: tx.money_in || false,
        amount: tx.amount || 0
      }));

      // Get API key: Use demo key for unauthenticated users, user-specific key for authenticated users
      let apiKey: string | undefined;
      
      if (!userId) {
        // For unauthenticated users, use demo/generic API key
        apiKey = process.env.EXPENSE_SORTED_API_KEY;
        console.log('Using demo API key for unauthenticated user');
      } else {
        // For authenticated users, try to get their personal API key
        // TODO: Implement user-specific API key retrieval from database
        // For now, fall back to the default key
        apiKey = process.env.EXPENSE_SORTED_API_KEY;
        console.log('Using default API key for authenticated user');
      }
      
      if (!apiKey) {
        console.error('No EXPENSE_SORTED_API_KEY configured');
        return NextResponse.json({ 
          error: 'Categorization service temporarily unavailable. Please try again later.' 
        }, { status: 503 });
      }

      // Call the categorization service
      const categorizeResponse = await fetch(`${process.env.EXPENSE_SORTED_API}/auto-classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          transactions: formattedTransactions
        }),
      });

      if (!categorizeResponse.ok) {
        const errorText = await categorizeResponse.text();
        console.error('Categorization service error:', categorizeResponse.status, errorText);
        
        // Provide user-friendly error messages
        if (categorizeResponse.status === 401) {
          return NextResponse.json({ 
            error: 'Service authentication failed. Please try again later.' 
          }, { status: 503 });
        } else if (categorizeResponse.status === 429) {
          return NextResponse.json({ 
            error: 'Service temporarily overloaded. Please try again in a few minutes.' 
          }, { status: 429 });
        } else {
          return NextResponse.json({ 
            error: 'Categorization service temporarily unavailable. Please try again later.' 
          }, { status: 503 });
        }
      }

      const categorizedResults = await categorizeResponse.json();
      
      // Add metadata about the request for analytics/debugging
      const response = {
        ...categorizedResults,
        metadata: {
          isAuthenticated: !!userId,
          transactionCount: formattedTransactions.length,
          timestamp: new Date().toISOString()
        }
      };
      
      return NextResponse.json(response);

    } catch (error: any) {
      console.error('Categorize endpoint error:', error);
      return NextResponse.json({ 
        error: 'Failed to categorize transactions. Please try again later.' 
      }, { status: 500 });
    }
  }

  // --- Action Not Found ---
  return NextResponse.json({ error: `Action not found: ${action}` }, { status: 404 });
} 