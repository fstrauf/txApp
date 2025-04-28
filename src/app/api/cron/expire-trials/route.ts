import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, subscriptionStatusEnum } from '@/db/schema';
import { sql, lt, and, isNotNull, ne, type SQL } from 'drizzle-orm';

// Function to get the current time in UTC for comparison
// Drizzle needs a specific format sometimes, or we can use SQL directly
const nowUtc = (): SQL => sql`now() at time zone 'utc'`;

export async function GET(request: Request) {
  // 1. Secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Expire trials: Unauthorized attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron job: Expire trials starting...');

  try {
    // 2. Update users whose trial has ended directly
    // Conditions:
    // - trialEndsAt is not NULL
    // - trialEndsAt is in the past (less than now UTC)
    // - subscriptionStatus is NOT 'ACTIVE' (don't deactivate paying users)
    // Set subscriptionStatus to NULL
    const updateResult = await db.update(users)
      .set({
        subscriptionStatus: null,
      })
      .where(
        and(
          isNotNull(users.trialEndsAt),
          lt(users.trialEndsAt, nowUtc()),
          ne(users.subscriptionStatus, subscriptionStatusEnum.enumValues[0]) // Not 'ACTIVE'
          // Optional check: isNotNull(users.subscriptionStatus) 
        )
      )
      .returning({ id: users.id }); // Keep returning IDs for logging/count

    const updatedCount = updateResult.length;

    if (updatedCount > 0) {
       console.log(`Cron job: Successfully updated status for ${updatedCount} users.`);
    } else {
       console.log('Cron job: No expired trials found to process.');
    }

    return NextResponse.json({ success: true, updatedUsers: updatedCount });

  } catch (error) {
    console.error("Cron job 'expire-trials' failed:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 