import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, categories as dbCategories } from '@/db/schema';
import { z } from 'zod';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { parse } from 'date-fns';
import { eq, and, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

// --- Zod Schemas --- 
// Base schema for config fields (without refine)
const baseImportConfigSchemaObject = z.object({
  bankAccountId: z.string().uuid('Bank Account ID must be a valid UUID'),
  mappings: z.object({
    date: z.string().min(1, 'Date column mapping is required'),
    amount: z.string().min(1, 'Amount column mapping is required'),
    description: z.string().min(1, 'Description column mapping is required'),
    description2: z.string().optional(),
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
export async function POST(request: NextRequest, context: { params: { action: string } }) {
  // Access params through the context object provided as the second argument
  const action = context.params.action; 

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
      
      // --- Log Received Config --- 
      console.log("[API /transactions/import] Received config string:", configString); 
      
      if (!file || !(file instanceof File)) { return NextResponse.json({ error: 'CSV file is required' }, { status: 400 }); }
      if (!configString || typeof configString !== 'string') { return NextResponse.json({ error: 'Import configuration is required' }, { status: 400 }); }

      // Parse the combined payload from the config string
      let payload: FullImportPayload;
      let parsedJsonConfig: any;
      try {
        parsedJsonConfig = JSON.parse(configString);
        console.log("[API /transactions/import] Parsed JSON config:", JSON.stringify(parsedJsonConfig, null, 2));
      } catch (jsonError) {
        console.error("[API /transactions/import] JSON Parsing Error:", jsonError);
        return NextResponse.json({ error: 'Invalid configuration format: Malformed JSON' }, { status: 400 });
      }

      // --- Log Validation Result ---
      const validationResult = fullImportPayloadSchema.safeParse(parsedJsonConfig);
      if (!validationResult.success) {
        console.error("[API /transactions/import] Config Payload Zod Validation Error:", validationResult.error.errors);
        const message = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return NextResponse.json({ error: `Configuration Error: ${message}`, details: validationResult.error.errors }, { status: 400 });
      }
      
      // Validation passed, proceed with validated data
      payload = validationResult.data;
      console.log("[API /transactions/import] Config validation successful. Payload:", JSON.stringify(payload, null, 2));

      const fileText = await file.text();
      const results: any[] = [];
      let parseError = false;
      let parsedHeaders: string[] = []; // Variable to store headers

      Papa.parse(fileText, {
         header: true, skipEmptyLines: true, delimiter: payload.delimiter, dynamicTyping: true, transformHeader: header => header.trim(),
        // Capture headers in the first step
        step: (stepResults, parser) => {
            if (results.length === 0) { // Capture on first row data
               parsedHeaders = stepResults.meta.fields || [];
               console.log("[API /transactions/import] Detected Headers:", parsedHeaders); // Log detected headers
            }
            results.push(stepResults.data);
        },
        complete: (parsedResults) => { 
           // Fallback if step didn't capture (e.g., empty file after headers)
           if(parsedHeaders.length === 0 && parsedResults.meta.fields) {
               parsedHeaders = parsedResults.meta.fields;
                console.log("[API /transactions/import] Detected Headers (from complete):", parsedHeaders); 
           }
           if (parsedResults.errors.length > 0) { console.error("CSV Parsing Errors:", parsedResults.errors); parseError = true; return; } 
         },
        error: (error: Error) => { console.error('Critical CSV parsing error:', error); parseError = true; } // Ensure parseError is set
      });

      if (parseError) { return NextResponse.json({ error: 'Failed to parse CSV file. Check format and delimiter.' }, { status: 400 }); }

      // --- Column Validation --- 
      const mappedColumns = Object.values(payload.mappings).filter(Boolean) as string[];
      if (payload.amountFormat === 'sign_column' && payload.signColumn) {
         mappedColumns.push(payload.signColumn);
      }
      
      // Log the columns we expect based on mappings
      console.log("[API /transactions/import] Mapped Columns to find:", mappedColumns); 

      // Check if all *mapped* columns exist in the file
      // Ensure parsedHeaders has been populated
      if (parsedHeaders.length === 0 && results.length > 0) {
           // Attempt to get headers from the first data row if meta fields weren't available
           parsedHeaders = Object.keys(results[0]);
           console.log("[API /transactions/import] Detected Headers (from first row):", parsedHeaders);
      } else if (parsedHeaders.length === 0) {
           console.error("[API /transactions/import] Could not determine CSV headers.");
           return NextResponse.json({ error: "Could not read headers from CSV file." }, { status: 400 });
      }

      const missingColumns = mappedColumns.filter(col => !parsedHeaders.includes(col));
      if (missingColumns.length > 0) {
         console.error(`[API /transactions/import] Missing Columns Error. Missing: ${missingColumns.join(', ')}. Available: ${parsedHeaders.join(', ')}`); // Log specific error
         return NextResponse.json({ error: `Mapped columns not found in CSV headers: ${missingColumns.join(', ')}. Available headers: ${parsedHeaders.join(', ')}` }, { status: 400 });
      }
      console.log("[API /transactions/import] All mapped columns found in headers."); // Log success

      // --- Fetch User Categories Again (Needed if Creating Categories during import) --- 
      // Fetch categories AFTER potential creation step on frontend to get latest IDs
      const userCategories = await db.select({ id: dbCategories.id, name: dbCategories.name })
                                     .from(dbCategories)
                                     .where(eq(dbCategories.userId, userId));
      const categoryNameToIdMap = new Map(userCategories.map(cat => [cat.name.toLowerCase(), cat.id]));
      console.log(`Fetched ${categoryNameToIdMap.size} categories for user ${userId} before processing rows.`);

      // --- Process Rows --- 
      console.log("[API /transactions/import] Starting row processing..."); // Add log
      const preparedTransactions = [];
      const processingErrors: { row: number; error: string; data: any }[] = [];
      const referenceDate = new Date();

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowIndex = i + 1; // Row number in the *parsed results*
        const originalRowIndex = rowIndex + payload.skipRows; // Actual row number in file
        
        console.log(`[API /transactions/import] Processing file row ${originalRowIndex} (parsed index ${i})`); // Log row start

        try {
          // Extract core data headers
          const dateHeader = payload.mappings.date;
          const amountHeader = payload.mappings.amount;
          const descriptionHeader = payload.mappings.description;
          const description2Header = payload.mappings.description2;
          const currencyHeader = payload.mappings.currency;
          const categoryHeader = payload.mappings.category;
          const signHeader = payload.signColumn;

          // --- Description Processing ---
          const descriptionValue = descriptionHeader ? (row[descriptionHeader] ?? '') : '';
          const description2Value = description2Header ? (row[description2Header] ?? '') : '';
          let finalDescription = (String(descriptionValue).trim() + ' ' + String(description2Value).trim()).trim();

          if (!finalDescription && (String(descriptionValue).trim() || String(description2Value).trim())) {
              console.warn(`[API /transactions/import] Row ${originalRowIndex}: finalDescription is empty despite source having content. Desc1: '${descriptionValue}', Desc2: '${description2Value}'`);
              finalDescription = String(descriptionValue).trim() || String(descriptionValue).trim();
          }
          if (!finalDescription) {
              console.warn(`[API /transactions/import] Skipping row ${originalRowIndex} due to empty final description.`);
              processingErrors.push({ row: originalRowIndex, error: 'Skipped: Empty description after combining mapped fields.', data: row });
              continue; // Skip this row
          }

          // --- Date Processing ---
          const dateStr = row[dateHeader];
          if (!dateStr) {
              throw new Error('Missing date value');
          }
          let transactionDate: Date;
          try {
              // Attempt parsing with date-fns (more robust)
              transactionDate = parse(String(dateStr), payload.dateFormat, referenceDate); 
              if (isNaN(transactionDate.getTime())) {
                  throw new Error('Invalid date format after parsing with date-fns');
              }
              // Ensure it's UTC
              transactionDate = new Date(Date.UTC(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate()));
          } catch (dateError: any) {
              console.error(`[API /transactions/import] Date parsing error for row ${originalRowIndex}: '${dateStr}', format: '${payload.dateFormat}'. Error: ${dateError.message}`);
              throw new Error(`Invalid or unparseable date: '${dateStr}' with format '${payload.dateFormat}'`);
          }

          // --- Amount Processing ---
          const amountRaw = row[amountHeader];
          if (amountRaw === null || amountRaw === undefined || amountRaw === '') {
              throw new Error('Missing amount value');
          }
          let amountStr = String(amountRaw).replace(/[^0-9.,-]/g, '').replace(',', '.'); // Basic cleaning
          let parsedAmount = parseFloat(amountStr);

          if (isNaN(parsedAmount)) {
              throw new Error(`Invalid amount value: '${amountRaw}'`);
          }

          let finalAmount = parsedAmount;
          type TransactionType = 'credit' | 'debit';
          let transactionType: TransactionType = finalAmount >= 0 ? 'credit' : 'debit';

          if (payload.amountFormat === 'negate') {
              finalAmount = -finalAmount;
              transactionType = finalAmount >= 0 ? 'credit' : 'debit';
          } else if (payload.amountFormat === 'sign_column' && signHeader) {
              const signValue = String(row[signHeader]).toLowerCase();
              if (signValue.includes('d') || signValue.includes('-') || signValue.includes('out')) {
                  finalAmount = -Math.abs(finalAmount); 
                  transactionType = 'debit';
              } else {
                  finalAmount = Math.abs(finalAmount);
                  transactionType = 'credit';
              }
          } else { // standard format
              finalAmount = Math.abs(finalAmount); // Store amount as absolute value
              // transactionType already determined by initial sign
          }
          
          // Round to 2 decimal places (cents)
          finalAmount = Math.round(finalAmount * 100) / 100;

          // --- Currency Processing ---
          let currencyValue: string | null = null;
          if (currencyHeader && row[currencyHeader]) {
              currencyValue = String(row[currencyHeader]).toUpperCase().trim();
              if (currencyValue.length > 3) currencyValue = currencyValue.substring(0, 3); // Basic validation
          } // If not provided or empty, keep null

          // --- Category Processing ---
          let categoryId: string | null = null;
          if (categoryHeader && row[categoryHeader]) {
              const categoryNameRaw = String(row[categoryHeader]).trim();
              if (categoryNameRaw) {
                   const categoryNameLower = categoryNameRaw.toLowerCase();
                   // 1. Check existing categories map
                   if (categoryNameToIdMap.has(categoryNameLower)) {
                       categoryId = categoryNameToIdMap.get(categoryNameLower)!;
                   } else {
                       // 2. Check user's explicit mapping decisions from payload
                       const mappingDecision = payload.categoryMappings?.[categoryNameRaw]; // Use raw name as key
                       if (mappingDecision) {
                           if (mappingDecision.targetId === '__CREATE__') {
                               // Should not happen if frontend validation worked, but handle defensively
                               // Create the category if it wasn't created yet (e.g., batch creation failed)
                               const newName = mappingDecision.newName?.trim();
                               if (newName) {
                                   try {
                                       const [newCategory] = await db.insert(dbCategories)
                                          .values({ id: uuidv4(), userId, name: newName })
                                          .returning({ id: dbCategories.id, name: dbCategories.name });
                                       console.log(`Dynamically created category: ${newCategory.name} (${newCategory.id})`);
                                       categoryId = newCategory.id;
                                       categoryNameToIdMap.set(newName.toLowerCase(), newCategory.id); // Update map
                                   } catch (createError) {
                                       console.error(`Error dynamically creating category '${newName}' for row ${originalRowIndex}:`, createError);
                                       processingErrors.push({ row: originalRowIndex, error: `Failed to create category '${newName}'`, data: row });
                                       // Decide whether to continue or throw? For now, continue without category.
                                   }
                               } else {
                                    console.warn(`Row ${originalRowIndex}: Category mapping decision was '__CREATE__' but no new name provided.`);
                               }
                           } else if (mappingDecision.targetId) { // Map to existing category ID
                               categoryId = mappingDecision.targetId;
                           } // else: targetId is null (explicitly unmapped), so categoryId remains null
                       } // else: no mapping decision, category not found -> categoryId remains null
                   } 
              }
          }

          // --- Duplicate Check --- 
          console.log(`[API /transactions/import] Checking for duplicates for row ${originalRowIndex}...`);
          const dateStartOfDay = new Date(transactionDate);
          dateStartOfDay.setUTCHours(0, 0, 0, 0);

          const existingTx = await db.query.transactions.findFirst({
              where: and(
                  eq(transactions.userId, userId),
                  eq(transactions.bankAccountId, payload.bankAccountId),
                  sql`DATE(${transactions.date}) = DATE(${dateStartOfDay})`,
                  eq(transactions.amount, finalAmount.toFixed(2)),
                  eq(transactions.description, finalDescription) // Use concatenated description
              ),
              columns: { id: true } // Only need the ID to check for existence
          });

          if (existingTx) {
              console.log(`[API /transactions/import] Duplicate found for row ${originalRowIndex}. Skipping.`);
              processingErrors.push({ row: originalRowIndex, error: 'Duplicate transaction found', data: row });
              continue; // Skip this row
          }

          // --- Prepare Data for Insertion --- 
          const transactionData = {
              id: uuidv4(),
              userId,
              bankAccountId: payload.bankAccountId,
              date: transactionDate, // Use the validated Date object
              description: finalDescription, // Use the concatenated description
              amount: finalAmount.toFixed(2),
              currency: currencyValue,
              type: transactionType,
              categoryId: categoryId, 
              originalRowData: JSON.stringify(row), // Store original data for reference
              source: 'csv_import' as const,
          };

          preparedTransactions.push(transactionData);
          console.log(`[API /transactions/import] Successfully prepared row ${originalRowIndex} for insertion.`); // Log success

        } catch (error: any) {
          console.error(`[API /transactions/import] Error processing row ${originalRowIndex}:`, error);
          processingErrors.push({ row: originalRowIndex, error: error.message || 'Unknown processing error', data: row });
        }
      } // End of row processing loop

      // --- End Row Processing --- 
      console.log(`[API /transactions/import] Finished row processing. Errors: ${processingErrors.length}, Prepared: ${preparedTransactions.length}`); // Log summary

      if (processingErrors.length > 0) {
        console.error("[API /transactions/import] Returning 400 due to processing errors.", processingErrors.slice(0, 5)); // Log details before returning
        return NextResponse.json({ error: `Failed to process ${processingErrors.length} rows. See server logs for details.`, details: processingErrors.slice(0, 10) }, { status: 400 });
      }
      if (preparedTransactions.length === 0) {
         return NextResponse.json({ message: 'No valid transactions found to import.' });
      }

      // --- Database Insertion --- 
      console.log(`Attempting to insert ${preparedTransactions.length} new transactions into DB.`);
      const result = await db.insert(transactions).values(preparedTransactions).returning({ id: transactions.id });
      console.log(`Successfully inserted ${result.length} transactions.`);

      // 5. Modify response message
      let message = `Successfully imported ${result.length} transactions.`;
      return NextResponse.json({ message: message, count: result.length });

    } catch (error: any) {
       console.error('Import endpoint error:', error);
       return NextResponse.json({ error: error.message || 'Failed to import transactions' }, { status: 500 });
    }
  }

  // --- Action Not Found ---
  return NextResponse.json({ error: `Action not found: ${action}` }, { status: 404 });
}