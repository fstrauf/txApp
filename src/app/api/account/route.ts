import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
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

    // Find user by userId using Drizzle
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log(`Found ${result.length} user records`);
    
    // Return all user data or null if not found
    return NextResponse.json(result.length > 0 ? result[0] : null);
  } catch (error) {
    console.error('Error fetching user account:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user account', 
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

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log(`Found ${existingUser.length} existing user records`);
    
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user with new API key
    const result = await db
      .update(users)
      .set({ api_key })
      .where(eq(users.id, userId))
      .returning();
    
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