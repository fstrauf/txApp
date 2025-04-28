import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { findUserByEmail } from '@/db/utils';
import { decryptApiKey } from '@/lib/encryption';

// Fetch categories from Lunch Money API
async function fetchLunchMoneyCategories(apiKey: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('https://dev.lunchmoney.app/v1/categories', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch categories from Lunch Money');
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories from Lunch Money:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching categories from Lunch Money');
    }
    throw error;
  }
}

// Update a transaction's category in Lunch Money
async function updateLunchMoneyCategory(apiKey: string, transactionId: string, categoryId: number | null) {
  try {
    const url = `https://dev.lunchmoney.app/v1/transactions/${transactionId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category_id: categoryId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update transaction category in Lunch Money');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating transaction category in Lunch Money:', error);
    throw error;
  }
}

// GET endpoint to fetch categories from Lunch Money
export async function GET(request: NextRequest) {
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

    const categories = await fetchLunchMoneyCategories(apiKey);
    
    // Format categories to match our expected structure
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id.toString(),
      name: cat.name,
      description: cat.description || '',
      isLunchMoneyCategory: true,
      excludeFromBudget: cat.exclude_from_budget || false,
      excludeFromTotals: cat.exclude_from_totals || false,
      isIncome: cat.is_income || false
    }));
    
    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Error in GET /api/lunch-money/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching categories' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a transaction's category in Lunch Money
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

    const { transactionId, categoryId } = await request.json();
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // Convert categoryId to number or null for Lunch Money API
    const lunchMoneyCategoryId = categoryId === "none" ? null : Number(categoryId);
    
    const result = await updateLunchMoneyCategory(
      apiKey, 
      transactionId,
      lunchMoneyCategoryId
    );
    
    return NextResponse.json({ 
      success: true, 
      transaction: result
    });
  } catch (error) {
    console.error('Error in PATCH /api/lunch-money/categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating category' },
      { status: 500 }
    );
  }
} 