import { Hono } from 'hono';
import type { Context } from 'hono';
import { db } from '../../db'; // Adjusted path
import { transactions } from '../../db/schema'; // Adjusted path
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs

const transactionsApi = new Hono();

// Define Zod schema for a single transaction for validation
const transactionSchema = z.object({
  date: z.string().datetime(), // Expecting ISO 8601 format
  description: z.string().min(1),
  amount: z.number(),
  type: z.string().min(1), // Consider using an enum if types are fixed
  bankAccountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  lunchMoneyCategory: z.string().optional(),
  lunchMoneyId: z.string().optional(),
});

// Define Zod schema for the import request body (array of transactions)
const importSchema = z.object({
  transactions: z.array(transactionSchema),
});

// Zod schema for the import configuration
const importConfigSchema = z.object({
  bankAccountId: z.string().uuid('Bank Account ID must be a valid UUID'),
  mappings: z.object({
    date: z.string().min(1, 'Date column mapping is required'),
    amount: z.string().min(1, 'Amount column mapping is required'),
    description: z.string().min(1, 'Description column mapping is required'),
    currency: z.string().optional(), // Currency might be optional if default is used or part of amount
    // Add other potential mappings if needed (e.g., category)
  }),
  dateFormat: z.string().min(1, 'Date format is required (e.g., YYYY-MM-DD)'), // Consider library like date-fns for complex formats
  amountFormat: z.enum(['standard', 'negate', 'sign_column'], { // Add more as needed
    errorMap: () => ({ message: 'Invalid amount format specified' })
  }),
  signColumn: z.string().optional(), // Required if amountFormat is 'sign_column'
  // TODO: Add config for default currency if mapping.currency is not provided
  skipRows: z.number().int().min(0).default(0),
  delimiter: z.string().optional(), // Let PapaParse detect if not provided
}).refine(data => data.amountFormat !== 'sign_column' || (data.amountFormat === 'sign_column' && data.signColumn), {
  message: "Sign column mapping is required when amount format is 'sign_column'",
  path: ["signColumn"], // Specify the path of the error
});

type ImportConfig = z.infer<typeof importConfigSchema>;

// Helper function to parse date string based on format (simple implementation)
// NOTE: This is basic. Consider date-fns for robust parsing of various formats.
function parseDate(dateStr: string, format: string): Date | null {
  // Basic replacements for common separators, assumes consistent format parts
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
      else if (formatParts[i].includes('M')) month = part - 1; // JS months are 0-indexed
      else if (formatParts[i].includes('D')) day = part;
  }
  
  // Add basic validation for year range if needed
  if (year < 1900 || year > 2100) return null;
  
  const date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues during parsing
  // Check if the constructed date is valid and matches parts (simple check)
  if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

// Refactored POST /api/transactions/import
transactionsApi.post(
  '/import',
  async (c: Context) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;

    try {
      const formData = await c.req.formData();
      const file = formData.get('file');
      const configString = formData.get('config');

      if (!file || !(file instanceof File)) {
        return c.json({ error: 'CSV file is required' }, 400);
      }
      if (!configString || typeof configString !== 'string') {
        return c.json({ error: 'Import configuration is required' }, 400);
      }

      // 1. Parse and validate configuration
      let config: ImportConfig;
      try {
        const parsedConfig = JSON.parse(configString);
        config = importConfigSchema.parse(parsedConfig);
      } catch (error) {
        console.error("Config parsing/validation error:", error);
        const message = error instanceof z.ZodError 
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : 'Invalid configuration format';
        return c.json({ error: `Configuration Error: ${message}` }, 400);
      }
      
      const fileText = await file.text();
      const results: any[] = [];
      let parseError = false;

      // 2. Parse the entire CSV
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        delimiter: config.delimiter, // Use provided or let PapaParse detect
        dynamicTyping: true, // Attempt basic type inference
        transformHeader: header => header.trim(), // Trim headers
        complete: (parsedResults) => {
          if (parsedResults.errors.length > 0) {
            console.error("CSV Parsing Errors:", parsedResults.errors);
            // Decide how to handle partial data vs complete failure
            // For now, fail if there are any parsing errors
            parseError = true;
            return; 
          }
          results.push(...parsedResults.data);
        },
        error: (error: Error) => {
            console.error('Critical CSV parsing error:', error);
            parseError = true;
        }
      });

      if (parseError) {
          return c.json({ error: 'Failed to parse CSV file. Check format and delimiter.' }, 400);
      }

      // Check if required columns exist after parsing
      const requiredColumns = Object.values(config.mappings).filter(Boolean) as string[];
      if (config.amountFormat === 'sign_column' && config.signColumn) {
          requiredColumns.push(config.signColumn);
      }
      const firstRow = results[0] || {};
      const parsedHeaders = Object.keys(firstRow);
      const missingColumns = requiredColumns.filter(col => !parsedHeaders.includes(col));

      if (missingColumns.length > 0) {
          return c.json({ error: `Missing required columns in CSV after header mapping: ${missingColumns.join(', ')}` }, 400);
      }
      
      // 3. Transform and Validate Data
      const preparedTransactions = [];
      const processingErrors: { row: number; error: string; data: any }[] = [];

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowIndex = i + config.skipRows + 1; // Adjust for header and skipped rows

        try {
          const dateStr = row[config.mappings.date];
          const amountRaw = row[config.mappings.amount];
          const description = row[config.mappings.description]?.toString() || '';
          // TODO: Handle currency mapping/default

          if (dateStr === undefined || amountRaw === undefined || description === '') {
              throw new Error('Missing essential data (date, amount, or description)');
          }

          // Parse Date
          const date = parseDate(dateStr.toString(), config.dateFormat);
          if (!date) {
            throw new Error(`Invalid date format for value '${dateStr}'. Expected format: ${config.dateFormat}`);
          }

          // Normalize Amount
          let amount = typeof amountRaw === 'string' 
              ? parseFloat(amountRaw.replace(/[^0-9.-]+/g, '')) 
              : Number(amountRaw);
          
          if (isNaN(amount)) {
              throw new Error(`Invalid amount format for value '${amountRaw}'`);
          }

          if (config.amountFormat === 'negate') {
            amount = -Math.abs(amount);
          } else if (config.amountFormat === 'sign_column' && config.signColumn) {
            // Example: sign column contains 'D' for debit (negative), 'C' for credit (positive)
            const signValue = row[config.signColumn]?.toString().toUpperCase();
            // Customize this logic based on expected sign values
            if (signValue === 'D' || signValue === 'DEBIT' || signValue === 'AUSGABE') {
              amount = -Math.abs(amount);
            } else {
              amount = Math.abs(amount);
            }
          }

          // Construct transaction object
          const transactionData = {
            id: uuidv4(), // Generate new UUID
            userId: userId,
            bankAccountId: config.bankAccountId,
            date: date,
            description: description.trim(),
            amount: String(amount.toFixed(2)), // Store as string/decimal in DB
            type: amount >= 0 ? 'credit' : 'debit', // Infer type from amount sign
            // Set defaults or map optional fields
            categoryId: null,
            notes: null,
            lunchMoneyCategory: null, 
            lunchMoneyId: null,
            isReconciled: false,
            isTrainingData: false,
          };

          // TODO: Add Zod validation for the final transactionData object?

          preparedTransactions.push(transactionData);
        } catch (error: any) {
          processingErrors.push({ row: rowIndex, error: error.message, data: row });
        }
      }

      if (processingErrors.length > 0) {
        console.error('Errors processing rows:', processingErrors);
        // Return partial success or complete failure? For now, fail.
        return c.json({ 
            error: `Failed to process ${processingErrors.length} rows. See details.`,
            details: processingErrors.slice(0, 10) // Return first 10 errors
         }, 400);
      }

      if (preparedTransactions.length === 0) {
        return c.json({ message: 'No valid transactions found in the file to import.' });
      }

      // 4. Bulk Insert
      const result = await db.insert(transactions).values(preparedTransactions).returning({ id: transactions.id });

      return c.json({ 
        message: `Successfully imported ${result.length} transactions.`,
        count: result.length 
      });

    } catch (error: any) {
      console.error('Import endpoint error:', error);
      // Handle potential DB errors (e.g., unique constraints) if necessary
      return c.json({ error: error.message || 'Failed to import transactions' }, 500);
    }
  }
);

// --- Analysis Endpoint ---

// Define Zod schema for analysis request (expects multipart/form-data with a 'file' field)
// We won't strictly validate the file type here, but rely on PapaParse handling
const analyzeSchema = z.object({}); // Placeholder, actual validation happens on form data

transactionsApi.post(
  '/analyze',
  // zValidator('form', analyzeSchema), // TODO: Add proper form data validation if needed
  async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return c.json({ error: 'CSV file is required' }, 400);
      }

      const fileText = await file.text();

      // Parse only the first few lines for preview
      let headers: string[] = [];
      let previewRows: any[] = [];
      let rowCount = 0;
      const PREVIEW_ROW_COUNT = 5;

      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        preview: PREVIEW_ROW_COUNT, // Limit parsing for preview
        step: (results) => {
          if (rowCount === 0) {
            headers = results.meta.fields || [];
          }
          if (rowCount < PREVIEW_ROW_COUNT) {
            previewRows.push(results.data);
          }
          rowCount++;
        },
        complete: () => {
          // Analysis complete
        },
        error: (error: Error) => {
          console.error('CSV parsing error during analysis:', error);
          // We might still have partial data, decide if we want to return it
          // For now, let's return an error if PapaParse encounters one.
          throw new Error('Failed to parse CSV file: ' + error.message);
        }
      });

      return c.json({
        headers,
        previewRows,
        detectedDelimiter: Papa.parse(fileText, { preview: 1 }).meta.delimiter || ',', // Attempt to detect delimiter
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      return c.json({ error: error.message || 'Failed to analyze CSV file' }, 500);
    }
  }
);

export default transactionsApi; 