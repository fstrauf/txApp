import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findUserByEmail } from '@/db/utils';
import { encryptApiKey } from '@/lib/encryption';

// GET handler to check if the user has Lunch Money credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return whether the user has an API key (but not the key itself)
    return NextResponse.json({
      hasLunchMoneyApiKey: !!user.lunchMoneyApiKey
    });
  } catch (error) {
    console.error('Error in GET /api/lunch-money/credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching credentials' },
      { status: 500 }
    );
  }
}

// POST handler to save or update Lunch Money API key
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
    
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    
    // Validate the API key by making a test request to Lunch Money API
    try {
      const response = await fetch('https://dev.lunchmoney.app/v1/me', {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        return NextResponse.json({ error: 'Invalid Lunch Money API key' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error validating Lunch Money API key:', error);
      return NextResponse.json({ error: 'Failed to validate Lunch Money API key' }, { status: 400 });
    }
    
    // --- Encrypt the API key before saving ---
    let encryptedApiKey: string;
    try {
      encryptedApiKey = encryptApiKey(apiKey);
    } catch (encError) {
      console.error('Failed to encrypt API key for user:', user.id, encError);
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 });
    }
    // --- End Encryption ---

    // Save the ENCRYPTED API key
    await db.update(users)
      .set({ lunchMoneyApiKey: encryptedApiKey })
      .where(eq(users.id, user.id as string));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/lunch-money/credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while saving credentials' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove Lunch Money API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remove the API key
    await db.update(users)
      .set({ lunchMoneyApiKey: null })
      .where(eq(users.id, user.id as string));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/lunch-money/credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while removing credentials' },
      { status: 500 }
    );
  }
} 