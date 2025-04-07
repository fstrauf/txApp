import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    // For anonymous users, the status is determined client-side via localStorage
    // Return null status, client will handle based on localStorage
    return NextResponse.json({ appBetaOptIn: null }); 
  }

  const userId = session.user.id;

  try {
    // Find the first account for the user to check the status
    // Assuming the status is consistent across a user's accounts or the first is representative
    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
      columns: {
        appBetaOptIn: true,
      },
    });

    // Return the status, which could be 'OPTED_IN', 'DISMISSED', or null
    return NextResponse.json({ appBetaOptIn: userAccount?.appBetaOptIn || null });

  } catch (error) {
    console.error('Error fetching appBetaOptIn status:', error);
    // Return null status in case of error, client can decide how to handle
    // Optionally, could return 500, but null simplifies client logic slightly
    return NextResponse.json({ appBetaOptIn: null, error: 'Failed to fetch status' }, { status: 500 }); 
  }
} 