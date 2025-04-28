import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { db } from '@/db';
import { users, subscriptionStatusEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Define the trial duration in days
const TRIAL_DURATION_DAYS = 14;

export async function POST() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch the user to check their current trial status
    const userResult = await db.select({
        trialEndsAt: users.trialEndsAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Check if the user has already started a trial (trialEndsAt is not null)
    if (user.trialEndsAt !== null) {
      return NextResponse.json({ error: 'Trial already activated or used.' }, { status: 400 });
    }

    // Calculate the trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

    // Update the user record with the trial end date AND set status to TRIALING
    await db.update(users)
      .set({
        trialEndsAt: trialEndDate,
        subscriptionStatus: subscriptionStatusEnum.enumValues[3] // Set status to 'TRIALING'
      })
      .where(eq(users.id, userId));

    console.log(`Trial started for user ${userId}, status set to TRIALING, ends at ${trialEndDate.toISOString()}`);
    return NextResponse.json({ success: true, trialEndsAt: trialEndDate.toISOString() });

  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 