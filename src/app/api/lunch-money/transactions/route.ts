import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { findUserByEmail } from '@/db/utils';
import { decryptApiKey } from '@/lib/encryption';

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
    // Parse amount first
    const amount = parseFloat(typeof tx.amount === 'string' ? tx.amount : String(tx.amount || '0'));
    // Derive is_income and type from the sign of the amount
    const isIncome = amount > 0;
    const type = isIncome ? 'income' : 'expense';

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
      amount: amount, // Use the parsed (and now signed) amount
      type: type,     // Use the derived type
      is_income: isIncome, // Use the derived boolean
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

    const encryptedApiKey = userResult[0]?.lunchMoneyApiKey;

    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not configured.' }, { status: 400 });
    }

    // --- Decrypt the API key ---
    let apiKey: string;
    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (decError) {
      console.error('Failed to decrypt API key for user:', userId, decError);
      // Return a generic error to avoid leaking details
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 }); 
    }
    // --- End Decryption ---

    // 2. Get Date & Status Parameters from Request URL
    const searchParams = request.nextUrl.searchParams;
    const endDate = searchParams.get('end_date') || getDateString(new Date());
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 90); // Default to last 90 days
    const startDate = searchParams.get('start_date') || getDateString(defaultStartDate);
    const statusFilter = searchParams.get('status') as 'cleared' | 'uncleared' | null; // Get the status filter

    // 3. Build Lunch Money API URL with parameters
    const url = new URL(LUNCH_MONEY_API_URL);
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('debit_as_negative', 'true');
    if (statusFilter) {
      url.searchParams.append('status', statusFilter);
    }

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
    const formattedData = formatTransactions(rawData.transactions || []);


    console.log(`Returning ${formattedData.length} transactions (filtered by API).`);

    // *** Return the filtered and formatted transactions ***
    return NextResponse.json({ transactions: formattedData }); 

  } catch (error) {
    console.error('Error fetching Lunch Money transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH endpoint to update a transaction's category and/or tags
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    // --- Decrypt API Key --- 
    const encryptedApiKey = user?.lunchMoneyApiKey;
    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not found or not configured.' }, { status: 400 });
    }
    let apiKey: string;
    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (decError) {
      console.error('Failed to decrypt API key for user:', user.id, decError);
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 }); 
    }
    // --- End Decryption ---

    // Read transactionId, categoryId, tags, AND status from the request body
    const { transactionId, categoryId, tags, status, notes, payee } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // Update the transaction directly using the official Lunch Money API
    const url = `https://dev.lunchmoney.app/v1/transactions/${transactionId}`;
    
    // Build the update object conditionally
    const updateObject: Record<string, any> = {};
    
    // --- Add Payee if provided --- 
    if (payee !== undefined) {
      updateObject.payee = payee;
    }

    // --- Add Notes if provided --- 
    if (notes !== undefined) {
      updateObject.notes = notes;
    }
    
    // --- Add Category ID if provided (also sets status) --- 
    if (categoryId !== undefined) {
      const lunchMoneyCategoryId = categoryId === "none" ? null : Number(categoryId);
      updateObject.category_id = lunchMoneyCategoryId;
      // When category changes, Lunch Money expects status to be set (usually cleared)
      updateObject.status = status || 'cleared'; // Use provided status or default to 'cleared'
    }
    
    // --- Add Status if provided *separately* from category --- 
    if (status !== undefined && categoryId === undefined) {
      updateObject.status = status; // Add status to the update object
    }
    
    // --- Add Tags if provided --- 
    if (tags !== undefined) {
      // Format tags correctly for Lunch Money API (array of strings)
      const tagsToSet = Array.isArray(tags)
        ? tags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean)
        : [];
      updateObject.tags = tagsToSet;
    }
    
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
        'Authorization': `Bearer ${apiKey}`, // Use DECRYPTED key
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
      message: `Transaction ${transactionId} updated.`, 
      updatedTags: tags // Return the tags that were set
    });

  } catch (error) {
    console.error('Error in PATCH /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating transaction' },
      { status: 500 }
    );
  }
} 