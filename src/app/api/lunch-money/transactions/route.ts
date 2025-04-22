import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { users, bankAccounts, transactions, categories } from '@/db/schema';
import { findUserByEmail, createId } from '@/db/utils';

const LUNCH_MONEY_API_URL = 'https://dev.lunchmoney.app/v1/transactions';

// Define interfaces for better type safety
interface LunchMoneyTransaction {
  id: string | number;
  date: string;
  payee?: string;
  original_name?: string;
  amount: string | number;
  is_income?: boolean;
  notes?: string;
  category_name?: string;
  tags?: Array<{id: number, name: string}> | string[];
  [key: string]: any; // Allow other properties
}

interface FormattedTransaction {
  lunchMoneyId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  is_income: boolean;
  lunchMoneyCategory: string | null;
  notes: string;
  tags: Array<{id: number, name: string}>;
  originalData?: any;
  [key: string]: any; // Allow additional properties
}

// Helper to get date strings (e.g., YYYY-MM-DD)
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

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
    const lunchMoneyCategory = tx.category_name || null;
    const isIncome = tx.is_income === true;

    // Standardize tags
    let standardizedTags: Array<{id: number, name: string}> = [];
    if (Array.isArray(tx.tags)) {
      standardizedTags = tx.tags.map((tag, index) => {
        if (typeof tag === 'string') {
          // Assign a temporary ID if only name is provided
          return { id: Date.now() + index, name: tag }; 
        } else if (typeof tag === 'object' && tag !== null && tag.name) {
          return { id: tag.id || Date.now() + index, name: tag.name };
        } else {
          // Handle potential unexpected tag format
          return { id: Date.now() + index, name: 'Invalid Tag' };
        }
      });
    }

    return {
      lunchMoneyId: tx.id.toString(),
      date: tx.date,
      description: tx.payee || tx.original_name || '',
      amount: parseFloat(typeof tx.amount === 'string' ? tx.amount : String(tx.amount || '0')),
      type: isIncome ? 'income' : 'expense',
      is_income: isIncome,
      lunchMoneyCategory,
      notes: tx.notes || '',
      tags: standardizedTags,
      originalData: tx
    };
  });
}

// GET handler to fetch transactions from Lunch Money
export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Get API Key
    const userResult = await db
      .select({ lunchMoneyApiKey: users.lunchMoneyApiKey })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const apiKey = userResult[0]?.lunchMoneyApiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not configured.' }, { status: 400 });
    }

    // 2. Get Date Parameters from Request URL
    const searchParams = request.nextUrl.searchParams;
    const endDate = searchParams.get('end_date') || getDateString(new Date());
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 90); // Default to last 90 days
    const startDate = searchParams.get('start_date') || getDateString(defaultStartDate);

    // 3. Construct URL with Parameters for Lunch Money API
    const url = new URL(LUNCH_MONEY_API_URL);
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    // Add other parameters like limit, offset, debit_as_negative if needed
    // url.searchParams.append('limit', '500'); 

    console.log(`Fetching from Lunch Money API: ${url.toString()}`);

    // 4. Fetch transactions from Lunch Money API using the constructed URL
    const response = await fetch(url.toString(), { 
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Increase timeout if necessary for large date ranges
      // next: { revalidate: 60 } // Optional: cache control
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) { /* Ignore parsing error */ }
      console.error('Lunch Money API Error:', response.status, response.statusText, errorBody);
      return NextResponse.json(
        { error: `Failed to fetch from Lunch Money: ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    // *** Format the transactions using the helper defined in *this* file ***
    const formattedData = formatTransactions(rawData.transactions || []);

    // *** Return the formatted transactions in the expected structure ***
    return NextResponse.json({ transactions: formattedData }); 

  } catch (error) {
    console.error('Error fetching Lunch Money transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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