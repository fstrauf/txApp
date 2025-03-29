import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Fetching API key for user ID: ${userId}`);

    // Find account by userId using Drizzle
    const result = await db
      .select({ api_key: accounts.api_key })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    console.log(`Found ${result.length} account records`);
    
    // Return the api_key or null if not found
    return NextResponse.json(result.length > 0 ? { api_key: result[0].api_key } : { api_key: null });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch account', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, api_key } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Updating API key for user ID: ${userId}`);
    console.log(`Required fields for Account table: id, userId, type, provider, providerAccountId`);

    // Check if account exists
    const existingAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    console.log(`Found ${existingAccount.length} existing account records`);
    
    let result;
    
    if (existingAccount.length > 0) {
      // Update existing account
      console.log(`Updating existing account for user ID: ${userId}`);
      result = await db
        .update(accounts)
        .set({ api_key })
        .where(eq(accounts.userId, userId))
        .returning();
    } else {
      // Create new account
      console.log(`Creating new account for user ID: ${userId}`);
      result = await db
        .insert(accounts)
        .values({
          id: uuid(),
          userId,
          api_key,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: userId,
        })
        .returning();
    }

    console.log(`Operation result:`, result);
    
    return NextResponse.json(result.length > 0 ? result[0] : { error: 'No result returned' });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ 
      error: 'Failed to update account', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 