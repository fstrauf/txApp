import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { findUserByEmail } from '@/db/utils';

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

// Function to format transactions for our application
function formatTransactions(transactions: LunchMoneyTransaction[]): FormattedTransaction[] {  
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

    // 2. Get Date & Status Parameters from Request URL
    const searchParams = request.nextUrl.searchParams;
    const endDate = searchParams.get('end_date') || getDateString(new Date());
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 90); // Default to last 90 days
    const startDate = searchParams.get('start_date') || getDateString(defaultStartDate);
    const statusFilter = searchParams.get('status') as 'cleared' | 'uncleared' | null; // Get the status filter

    // 3. Fetch ALL transactions for the date range from Lunch Money API
    // We will filter by status *after* fetching
    const url = new URL(LUNCH_MONEY_API_URL);
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);

    console.log(`Fetching from Lunch Money API: ${url.toString()}`);

    // 4. Fetch transactions
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
    let formattedData = formatTransactions(rawData.transactions || []);

    // *** Filter based on the status parameter ***
    console.log(`Applying status filter: ${statusFilter}`);
    formattedData = formattedData.filter(tx => {
      const txStatus = tx.originalData?.status;

      // Always exclude 'pending' status
      if (txStatus === 'pending') {
        return false;
      }

      // Apply the specific filter if provided
      if (statusFilter === 'cleared') {
        return txStatus === 'cleared';
      }
      if (statusFilter === 'uncleared') {
        // Keep if status is not 'cleared' (which includes 'uncleared' and potentially null/undefined)
        return txStatus !== 'cleared'; 
      }
      
      // If no status filter, keep everything (that isn't 'pending')
      // This case shouldn't happen with current frontend logic, but good to handle.
      return true; 
    });

    console.log(`Returning ${formattedData.length} transactions after filtering.`);

    // *** Return the filtered and formatted transactions ***
    return NextResponse.json({ transactions: formattedData }); 

  } catch (error) {
    console.error('Error fetching Lunch Money transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    
    // Read transactionId, categoryId, tags, AND status from the request body
    const { transactionId, categoryId, tags: existingTags, status } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // Update the transaction directly using the official Lunch Money API
    const url = `https://dev.lunchmoney.app/v1/transactions/${transactionId}`;
    
    // Build the update object
    const updateObject: any = {};
    
    // --- Add Category ID if provided --- 
    if (categoryId !== undefined) {
      const lunchMoneyCategoryId = categoryId === "none" ? null : Number(categoryId);
      updateObject.category_id = lunchMoneyCategoryId;
    }
    
    // --- Add Status if provided --- 
    if (status) {
      updateObject.status = status; // Add status to the update object
    }
    
    // --- Add Tags: Only include existing tags passed from frontend --- 
    // (We no longer automatically add 'tx-categorized')
    let currentTagNames = Array.isArray(existingTags) 
        ? existingTags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean) 
        : [];

    // Update the 'tags' field in the object sent to Lunch Money
    updateObject.tags = currentTagNames; // Send only the tags provided (or determined by frontend)
    
    const updateBody = {
      transaction: updateObject
    };
    
    console.log('Making PUT request to Lunch Money:', {
      url,
      method: 'PUT',
      body: JSON.stringify(updateBody, null, 2) // Log the body being sent
    });
    
    // Make the API call to Lunch Money
    const response = await fetch(url, {
      method: 'PUT', // Use PUT as per Lunch Money docs for updating
      headers: {
        'Authorization': `Bearer ${user.lunchMoneyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    });

    const responseData = await response.json();
    
    if (!response.ok || responseData.error) {
      const errorMessage = responseData.error ? 
        (Array.isArray(responseData.error) ? responseData.error.join(', ') : String(responseData.error)) : 
        `Failed to update transaction ${transactionId} in Lunch Money`;
      
      console.error('Lunch Money API error during PATCH:', response.status, responseData);
      return NextResponse.json({ error: errorMessage }, { status: response.status || 500 });
    }
    
    // Let's return a success message and the tags that were actually set
    return NextResponse.json({ 
      success: true, 
      message: `Transaction ${transactionId} updated.`, // Simplified message
      updatedTags: currentTagNames // Return the tags that were set
    });

  } catch (error) {
    console.error('Error in PATCH /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating transaction' },
      { status: 500 }
    );
  }
} 