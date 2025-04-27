import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { accounts, users } from '@/db/schema';
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
    // Find the user record directly
    const user = await db.query.users.findFirst({
      // Use users.id for the where clause
      where: eq(users.id, userId),
      columns: {
        // Select the appBetaOptIn column from the users table
        appBetaOptIn: true,
      },
    });

    // Return the status from the user record
    return NextResponse.json({ appBetaOptIn: user?.appBetaOptIn || null });

  } catch (error) {
    console.error('Error fetching appBetaOptIn status:', error);
    // Return null status in case of error, client can decide how to handle
    // Optionally, could return 500, but null simplifies client logic slightly
    return NextResponse.json({ appBetaOptIn: null, error: 'Failed to fetch status' }, { status: 500 }); 
  }
} 