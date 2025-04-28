import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryption';

const LUNCH_MONEY_API_URL = 'https://dev.lunchmoney.app/v1/transactions';
const EXPENSE_SORTED_TRAINED_TAG = 'expense-sorted-trained'; // Define the tag constant

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing start_date or end_date' }, { status: 400 });
  }

  try {
    // 1. Get and Decrypt API Key (reuse logic from GET transactions)
    const userResult = await db
      .select({ lunchMoneyApiKey: users.lunchMoneyApiKey })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const encryptedApiKey = userResult[0]?.lunchMoneyApiKey;
    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not configured.' }, { status: 400 });
    }
    let apiKey: string;
    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (decError) {
      console.error('[API Counts] Failed to decrypt API key for user:', userId, decError);
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 }); 
    }

    // 2. Build Lunch Money API URL (fetch ALL for range, ignore status filter)
    const url = new URL(LUNCH_MONEY_API_URL);
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('debit_as_negative', 'true'); // Keep consistent if needed

    console.log(`[API Counts] Fetching from Lunch Money API: ${url.toString()}`);

    // 3. Fetch ALL transactions for the date range
    // IMPORTANT: This might be slow/memory-intensive for large ranges. 
    // Check if Lunch Money has a dedicated count endpoint or better filtering.
    const response = await fetch(url.toString(), { 
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) { /* Ignore parsing error */ }
      console.error('[API Counts] Lunch Money API Error:', response.status, response.statusText, errorBody);
      return NextResponse.json(
        { error: `Failed to fetch from Lunch Money: ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const allTransactions = rawData.transactions || [];

    // 4. Calculate counts
    let clearedCount = 0;
    let unclearedCount = 0;
    let trainedCount = 0; // Initialize trained count

    allTransactions.forEach((tx: any) => {
      // Status count
      if (tx.status === 'cleared') {
        clearedCount++;
      } else {
        unclearedCount++;
      }

      // Trained tag count
      const txTags = tx.tags || [];
      const hasTrainedTag = txTags.some((tag: any) => 
        (typeof tag === 'string' && tag.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG) || 
        (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG)
      );
      if (hasTrainedTag) {
        trainedCount++;
      }
    });

    console.log(`[API Counts] Calculated - Cleared: ${clearedCount}, Uncleared: ${unclearedCount}, Trained: ${trainedCount}`);

    // 5. Return all counts
    return NextResponse.json({ clearedCount, unclearedCount, trainedCount });

  } catch (error) {
    console.error('[API Transaction Counts] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch transaction counts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 