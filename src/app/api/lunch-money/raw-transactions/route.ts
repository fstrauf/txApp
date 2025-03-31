import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Fetch transactions directly from Lunch Money without formatting
async function fetchRawLunchMoneyTransactions(apiKey: string, startDate: string, endDate: string) {
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
    return data;
  } catch (error) {
    console.error('Error fetching raw transactions from Lunch Money:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email!))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.lunchMoneyApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not found' }, { status: 400 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    
    // Fetch raw transactions from Lunch Money
    const rawData = await fetchRawLunchMoneyTransactions(user.lunchMoneyApiKey, startDate, endDate);
    
    return NextResponse.json(rawData);
  } catch (error) {
    console.error('Error in GET /api/lunch-money/raw-transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching raw transactions' },
      { status: 500 }
    );
  }
} 