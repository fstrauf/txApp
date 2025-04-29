import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, categories as dbCategories } from '@/db/schema';
import { z } from 'zod';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { parse } from 'date-fns';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

// --- Zod Schemas --- 
// Base schema for config fields (without refine)
const baseImportConfigSchemaObject = z.object({
  bankAccountId: z.string().uuid('Bank Account ID must be a valid UUID'),
  mappings: z.object({
    date: z.string().min(1, 'Date column mapping is required'),
    amount: z.string().min(1, 'Amount column mapping is required'),
    description: z.string().min(1, 'Description column mapping is required'),
    currency: z.string().optional(),
    category: z.string().optional(),
  }),
  dateFormat: z.string().min(1, 'Date format is required (e.g., YYYY-MM-DD)'),
  amountFormat: z.enum(['standard', 'negate', 'sign_column'], {
    errorMap: () => ({ message: 'Invalid amount format specified' })
  }),
  signColumn: z.string().optional(),
  skipRows: z.number().int().min(0).default(0),
  delimiter: z.string().optional(),
});

// Schema for the category mapping decisions
const categoryMappingDecisionSchema = z.object({
    targetId: z.string().uuid().nullable().or(z.literal('__CREATE__')),
    newName: z.string().optional(),
}).refine(data => data.targetId !== '__CREATE__' || (data.targetId === '__CREATE__' && data.newName && data.newName.trim().length > 0), {
     message: "New category name is required when creating a category.",
     path: ["newName"],
 });

// Combined schema: Extend the base object, THEN refine
const fullImportPayloadSchema = baseImportConfigSchemaObject
    .extend({
        categoryMappings: z.record(z.string(), categoryMappingDecisionSchema).optional(),
    })
    .refine(data => data.amountFormat !== 'sign_column' || (data.amountFormat === 'sign_column' && data.signColumn), {
      message: "Sign column mapping is required when amount format is 'sign_column'",
      path: ["signColumn"],
    });

type FullImportPayload = z.infer<typeof fullImportPayloadSchema>;

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
  const action = params.action;

  // --- Authentication Check ---
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    console.log(`[API /transactions/${action}] Unauthorized access attempt.`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

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

      // Parse the combined payload from the config string
      let payload: FullImportPayload;
      try {
        const parsedPayload = JSON.parse(configString);
        payload = fullImportPayloadSchema.parse(parsedPayload);
      } catch (error) {
        const message = error instanceof z.ZodError ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : 'Invalid configuration format';
        console.error("[API /transactions/import] Config Payload Validation Error:", error);
        return NextResponse.json({ error: `Configuration Error: ${message}` }, { status: 400 });
      }
      
      const fileText = await file.text();
      const results: any[] = [];
      let parseError = false;
      Papa.parse(fileText, {
         header: true, skipEmptyLines: true, delimiter: payload.delimiter, dynamicTyping: true, transformHeader: header => header.trim(),
        complete: (parsedResults) => { if (parsedResults.errors.length > 0) { console.error("CSV Parsing Errors:", parsedResults.errors); parseError = true; return; } results.push(...parsedResults.data); },
        error: (error: Error) => { console.error('Critical CSV parsing error:', error); parseError = true; }
      });
      if (parseError) { return NextResponse.json({ error: 'Failed to parse CSV file. Check format and delimiter.' }, { status: 400 }); }

      // --- Column Validation --- 
      // Use payload.mappings for validation
      const mappedColumns = Object.values(payload.mappings).filter(Boolean) as string[];
      if (payload.amountFormat === 'sign_column' && payload.signColumn) {
         mappedColumns.push(payload.signColumn);
      }
      const firstRow = results[0] || {};
      const parsedHeaders = Object.keys(firstRow);
      // Check if all *mapped* columns exist in the file
      const missingColumns = mappedColumns.filter(col => !parsedHeaders.includes(col));
      if (missingColumns.length > 0) {
         // More specific error message
         return NextResponse.json({ error: `Mapped columns not found in CSV headers: ${missingColumns.join(', ')}. Available headers: ${parsedHeaders.join(', ')}` }, { status: 400 });
      }

      // --- Fetch User Categories Again (Needed if Creating Categories during import) --- 
      // Fetch categories AFTER potential creation step on frontend to get latest IDs
      const userCategories = await db.select({ id: dbCategories.id, name: dbCategories.name })
                                     .from(dbCategories)
                                     .where(eq(dbCategories.userId, userId));
      const categoryNameToIdMap = new Map(userCategories.map(cat => [cat.name.toLowerCase(), cat.id]));
      console.log(`Fetched ${categoryNameToIdMap.size} categories for user ${userId} before processing rows.`);

      // --- Process Rows --- 
      const preparedTransactions = [];
      const processingErrors: { row: number; error: string; data: any }[] = [];
      const referenceDate = new Date();

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowIndex = i + payload.skipRows + 1; 
        try {
          // Extract core data using payload
          const dateStr = row[payload.mappings.date];
          const amountRaw = row[payload.mappings.amount];
          const description = row[payload.mappings.description]?.toString() || '';
          if (dateStr === undefined || amountRaw === undefined || description === '') {
             throw new Error('Missing essential data (date, amount, or description)');
          }

          // Parse Date using payload.dateFormat
          const date = parse(dateStr.toString(), payload.dateFormat, referenceDate);
          if (!date || isNaN(date.getTime())) {
             throw new Error(`Invalid date format for value '${dateStr}' using format '${payload.dateFormat}'`);
          }

          // Parse Amount using payload.amountFormat etc.
          let amount = typeof amountRaw === 'string' ? parseFloat(amountRaw.replace(/[^0-9.-]+/g, '')) : Number(amountRaw);
          if (isNaN(amount)) { throw new Error(`Invalid amount format for value '${amountRaw}'`); }
          // Adjust amount based on format
          if (payload.amountFormat === 'negate') { amount = -Math.abs(amount); }
          else if (payload.amountFormat === 'sign_column' && payload.signColumn) {
            const signValue = row[payload.signColumn]?.toString().toUpperCase();
             if (signValue === 'D' || signValue === 'DEBIT' || signValue === 'AUSGABE') { amount = -Math.abs(amount); }
             else { amount = Math.abs(amount); }
          }

          // --- Determine Category ID using Frontend Mappings --- 
          let categoryId: string | null = null;
          const categoryHeader = payload.mappings.category; // The header name mapped to category
          
          if (categoryHeader && payload.categoryMappings && row[categoryHeader] !== undefined && row[categoryHeader] !== null) {
             const csvCategoryName = String(row[categoryHeader]).trim();
             
             if (csvCategoryName) {
                 // Find the decision made by the user for this CSV category
                 const mappingDecision = payload.categoryMappings[csvCategoryName];
                 
                 if (mappingDecision) {
                     if (mappingDecision.targetId === null) {
                         // User explicitly chose to skip this category
                         categoryId = null;
                     } else if (mappingDecision.targetId === '__CREATE__') {
                         // User chose to create. Find the ID of the *actually* created category.
                         // We rely on the frontend validation ensuring names are unique before creation.
                         const newNameLower = mappingDecision.newName?.trim().toLowerCase();
                         if (newNameLower) {
                             const createdId = categoryNameToIdMap.get(newNameLower);
                             if (createdId) {
                                 categoryId = createdId;
                             } else {
                                 // This should ideally not happen if frontend creation succeeded and we refetched
                                 console.warn(`Row ${rowIndex}: Could not find created category ID for '${mappingDecision.newName}'. Skipping.`);
                                 categoryId = null; 
                             }
                         }
                     } else {
                         // User mapped to an existing category ID
                         categoryId = mappingDecision.targetId; 
                     }
                 } else {
                     // CSV category name was present but wasn't in the mapping step (e.g., added after analysis?)
                     // Defaulting to skip
                     console.warn(`Row ${rowIndex}: Category mapping decision not found for CSV category '${csvCategoryName}'. Skipping.`);
                     categoryId = null;
                 }
             } // else: CSV category cell was empty, categoryId remains null
          } // else: No category header mapped, categoryId remains null

          // Prepare Transaction Data
          const transactionData = {
            id: uuidv4(),
            userId: userId,
            bankAccountId: payload.bankAccountId,
            date: date,
            description: description.trim(),
            amount: String(amount.toFixed(2)),
            type: amount >= 0 ? 'credit' : 'debit',
            categoryId: categoryId, // Assign the resolved ID
            notes: null,
            lunchMoneyCategory: null,
            lunchMoneyId: null,
            isReconciled: false,
            isTrainingData: false,
          };
          preparedTransactions.push(transactionData);
        } catch (error: any) {
           processingErrors.push({ row: rowIndex, error: error.message, data: row });
        }
      }
      // --- End Row Processing --- 

      if (processingErrors.length > 0) {
        return NextResponse.json({ error: `Failed to process ${processingErrors.length} rows.`, details: processingErrors.slice(0, 10) }, { status: 400 });
      }
      if (preparedTransactions.length === 0) {
         return NextResponse.json({ message: 'No valid transactions found to import.' });
      }

      // --- Database Insertion --- 
      console.log(`Attempting to insert ${preparedTransactions.length} transactions into DB.`);
      const result = await db.insert(transactions).values(preparedTransactions).returning({ id: transactions.id });
      console.log(`Successfully inserted ${result.length} transactions.`);
      return NextResponse.json({ message: `Successfully imported ${result.length} transactions.`, count: result.length });

    } catch (error: any) {
       console.error('Import endpoint error:', error);
       return NextResponse.json({ error: error.message || 'Failed to import transactions' }, { status: 500 });
    }
  }

  // --- Action Not Found ---
  return NextResponse.json({ error: `Action not found: ${action}` }, { status: 404 });
}