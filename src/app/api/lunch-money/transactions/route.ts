import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { users, bankAccounts, transactions, categories } from '@/db/schema';
import { findUserByEmail, createId } from '@/db/utils';

// Define interfaces for better type safety
interface LunchMoneyTransaction {
  id: string | number;
  date: string;
  payee?: string;
  original_name?: string;
  amount: string | number;
  notes?: string;
  category_name?: string;
  tags?: string[];
  [key: string]: any; // Allow other properties
}

interface FormattedTransaction {
  lunchMoneyId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  lunchMoneyCategory: string | null;
  notes: string;
  tags: string[];
  originalData?: any;
  [key: string]: any; // Allow additional properties
}

// This function fetches transactions from the Lunch Money API
async function fetchLunchMoneyTransactions(apiKey: string, startDate: string, endDate: string): Promise<LunchMoneyTransaction[]> {
  try {
    const url = `https://dev.lunchmoney.app/v1/transactions?start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch transactions from Lunch Money');
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions from Lunch Money:', error);
    throw error;
  }
}

// Function to format transactions for our application
function formatTransactions(transactions: LunchMoneyTransaction[]): FormattedTransaction[] {
  // Log first transaction to see the format
  if (transactions.length > 0) {
    console.log('Sample Lunch Money transaction:', JSON.stringify(transactions[0], null, 2));
  }
  
  return transactions.map(tx => {
    // Extract category information from Lunch Money
    // Lunch Money provides category_name and category_id directly on the transaction object
    const lunchMoneyCategory = tx.category_name || null;
    
    return {
      lunchMoneyId: tx.id.toString(),
      date: tx.date,
      description: tx.payee || tx.original_name || '',
      amount: parseFloat(typeof tx.amount === 'string' ? tx.amount : tx.amount.toString()),
      type: Number(tx.amount) < 0 ? 'expense' : 'income',
      lunchMoneyCategory,
      notes: tx.notes || '',
      tags: tx.tags || [],  // Include tags from Lunch Money
      originalData: tx
    };
  });
}

// GET handler to fetch transactions from Lunch Money
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Find user by email using the utility function
    const user = await findUserByEmail(session.user.email!);
    
    if (!user?.lunchMoneyApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not found' }, { status: 400 });
    }
    
    const userId = user.id as string;
    const searchParams = request.nextUrl.searchParams;
    
    // If specific transaction IDs are provided, fetch those from the database
    if (searchParams.has('ids')) {
      const ids = searchParams.get('ids')!.split(',');
      
      // Escape and validate IDs to prevent SQL injection
      const validatedIds = ids.filter(id => id.trim().length > 0).map(id => id.trim());
      
      // Only proceed if we have valid IDs
      if (validatedIds.length === 0) {
        return NextResponse.json({ transactions: [] });
      }

      // Use the db.prepare pattern that Drizzle supports
      const query = db.select().from(transactions)
        .where(
          and(
            eq(transactions.userId, userId as string),
            inArray(transactions.lunchMoneyId, validatedIds)
          )
        );
      
      const result = await query;
      
      // Fetch categories separately for each transaction
      const txWithCategories = await Promise.all(
        result.map(async (tx) => {
          if (tx.categoryId) {
            const categoryQuery = db.select()
              .from(categories)
              .where(eq(categories.id, tx.categoryId))
              .limit(1);
              
            const categoryResult = await categoryQuery;
              
            return {
              ...tx,
              category: categoryResult.length > 0 ? categoryResult[0] : null
            };
          }
          return { ...tx, category: null };
        })
      );
      
      return NextResponse.json({ transactions: txWithCategories });
    }
    
    // Otherwise fetch transactions from Lunch Money API
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    
    const lunchMoneyTransactions = await fetchLunchMoneyTransactions(user.lunchMoneyApiKey as string, startDate, endDate);
    
    // Log a sample transaction structure to debug
    if (lunchMoneyTransactions.length > 0) {
      const sampleTx = lunchMoneyTransactions[0];
      // Only log properties that are actually present
      console.log('FULL SAMPLE TX:', JSON.stringify({
        id: sampleTx.id,
        date: sampleTx.date,
        payee: sampleTx.payee || '',
        amount: sampleTx.amount,
        category: sampleTx.category_name || '',
        category_id: sampleTx.category_id || ''
      }, null, 2));
    }
    
    const formattedTransactions = formatTransactions(lunchMoneyTransactions);
    
    // Check if any of these transactions are already in our database
    const lunchMoneyIds = formattedTransactions.map(tx => tx.lunchMoneyId);
    
    // Only proceed if we have IDs
    if (lunchMoneyIds.length === 0) {
      return NextResponse.json({ transactions: formattedTransactions });
    }

    // Use the Drizzle query builder instead of raw SQL
    const query = db.select({
        id: transactions.id,
        lunchMoneyId: transactions.lunchMoneyId,
        categoryId: transactions.categoryId,
        isTrainingData: transactions.isTrainingData,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId as string),
          inArray(transactions.lunchMoneyId, lunchMoneyIds)
        )
      );

    const existingTransactions = await query;
    
    // Fetch categories for existing transactions
    const existingTransactionsWithCategories = await Promise.all(
      existingTransactions.map(async (tx) => {
        if (tx.categoryId) {
          const categoryQuery = db.select({
              id: categories.id,
              name: categories.name
            })
            .from(categories)
            .where(eq(categories.id, tx.categoryId))
            .limit(1);
            
          const categoryResult = await categoryQuery;
            
          return {
            ...tx,
            category: categoryResult.length > 0 ? categoryResult[0] : null
          };
        }
        return { ...tx, category: null };
      })
    );
    
    // Create a map of existing transactions for quick lookup
    const existingTransactionMap = new Map<string, any>();
    existingTransactionsWithCategories.forEach((tx: any) => {
      if (tx && tx.lunchMoneyId) {
        existingTransactionMap.set(tx.lunchMoneyId, tx);
      }
    });
    
    // Merge the transactions with data from our database if available
    const mergedTransactions = formattedTransactions.map(tx => {
      const existingTx = existingTransactionMap.get(tx.lunchMoneyId);
      if (existingTx) {
        return {
          ...tx,
          id: existingTx.id,
          category: existingTx.category,
          isTrainingData: existingTx.isTrainingData
        };
      }
      return tx;
    });
    
    return NextResponse.json({ transactions: mergedTransactions });
  } catch (error) {
    console.error('Error in GET /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching transactions' },
      { status: 500 }
    );
  }
}

// POST handler to import transactions to our database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id as string;
    const { transactions: transactionsToImport } = await request.json();
    
    if (!Array.isArray(transactionsToImport) || transactionsToImport.length === 0) {
      return NextResponse.json({ error: 'No valid transactions provided' }, { status: 400 });
    }
    
    // Get or create a default bank account for this user using Drizzle ORM
    const bankAccountQuery = db.select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.userId, userId as string),
          eq(bankAccounts.name, 'Lunch Money')
        )
      )
      .limit(1);

    const bankAccountResult = await bankAccountQuery;
    let bankAccount = bankAccountResult[0];

    if (!bankAccount) {
      // Create a new bank account using Drizzle
      const newBankAccountId = createId();
      const insertedAccounts = await db.insert(bankAccounts)
        .values({
          id: newBankAccountId,
          name: 'Lunch Money',
          type: 'Checking',
          userId: userId as string,
          balance: '0',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      bankAccount = insertedAccounts[0];
    }

    // Batch upsert transactions
    const results = [];

    for (const tx of transactionsToImport as FormattedTransaction[]) {
      // Handle lunchMoneyCategory properly
      let lunchMoneyCategory = null;
      if (typeof tx.lunchMoneyCategory === 'string' && tx.lunchMoneyCategory.trim() !== '') {
        lunchMoneyCategory = tx.lunchMoneyCategory;
      }
      
      // Check if transaction exists
      const existingTxQuery = db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId as string),
            eq(transactions.lunchMoneyId, tx.lunchMoneyId)
          )
        )
        .limit(1);
      
      const existingTxResult = await existingTxQuery;
      
      if (existingTxResult.length > 0) {
        // Update existing transaction with Drizzle
        const existingTx = existingTxResult[0];
        const updatedTx = await db.update(transactions)
          .set({
            description: tx.description,
            amount: tx.amount.toString(),
            date: new Date(tx.date),
            type: tx.type,
            notes: tx.notes || '',
            lunchMoneyCategory: lunchMoneyCategory,
            updatedAt: new Date()
          })
          .where(eq(transactions.id, existingTx.id))
          .returning();
        
        if (updatedTx.length > 0) {
          results.push(updatedTx[0]);
        }
      } else {
        // Create new transaction with Drizzle
        const newTransactionId = createId();
        const insertedTx = await db.insert(transactions)
          .values({
            id: newTransactionId,
            userId: userId as string,
            lunchMoneyId: tx.lunchMoneyId,
            description: tx.description,
            amount: tx.amount.toString(),
            date: new Date(tx.date),
            type: tx.type,
            notes: tx.notes || '',
            lunchMoneyCategory: lunchMoneyCategory,
            bankAccountId: bankAccount.id,
            isReconciled: false,
            isTrainingData: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        if (insertedTx.length > 0) {
          results.push(insertedTx[0]);
        }
      }
    }
    
    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Error in POST /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while importing transactions' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a transaction's category
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user?.lunchMoneyApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not found' }, { status: 400 });
    }
    
    const { transactionId, categoryId, tags } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // Update the transaction directly using the official Lunch Money API
    const url = `https://dev.lunchmoney.app/v1/transactions/${transactionId}`;
    
    // Build the update object based on what was provided
    const updateObject: any = {};
    
    // Add category_id if provided
    if (categoryId !== undefined) {
      // Convert categoryId to number or null for Lunch Money API
      const lunchMoneyCategoryId = categoryId === "none" ? null : Number(categoryId);
      updateObject.category_id = lunchMoneyCategoryId;
    }
    
    // Add tags if provided
    if (tags) {
      updateObject.tags = tags;
    }
    
    // Format the request body according to the API documentation
    const updateBody = {
      transaction: updateObject
    };
    
    console.log('Making request to Lunch Money:', {
      url,
      method: 'PUT',
      body: updateBody
    });
    
    // Make the API call to Lunch Money
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.lunchMoneyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    });

    // Get the response data
    const responseData = await response.json();
    
    // Check for errors
    if (!response.ok || responseData.error) {
      const errorMessage = responseData.error ? 
        (Array.isArray(responseData.error) ? responseData.error.join(', ') : responseData.error) : 
        'Failed to update transaction in Lunch Money';
      
      console.error('Lunch Money API error:', responseData);
      return NextResponse.json({ error: errorMessage }, { status: response.status || 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      transaction: responseData
    });
  } catch (error) {
    console.error('Error in PATCH /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating transaction' },
      { status: 500 }
    );
  }
} 