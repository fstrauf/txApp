import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withAuth } from '@/lib/authUtils';
import type { JwtPayload } from '@/lib/authUtils'; // Import the payload type

export const runtime = 'edge';
export const preferredRegion = 'fra1';

// Define the actual handler logic
async function handler(request: NextRequest, payload: JwtPayload) {
  try {
    const userId = payload.id;

    // Query user data and their latest subscription details
    const userResult = await db.query.users.findFirst({
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        stripeSubscriptionId: true,
      },
      where: eq(users.id, userId),
    });

    if (!userResult) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subscriptionResult = null;
    if (userResult.stripeSubscriptionId) {
      // Fetch the corresponding subscription details
      subscriptionResult = await db.query.subscriptions.findFirst({
        columns: {
          status: true,
          plan: true,
          billingCycle: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
        where: eq(subscriptions.stripeSubscriptionId, userResult.stripeSubscriptionId),
        orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      });
    }

    // Combine user and subscription data
    const userProfile = {
      ...userResult,
      subscription: subscriptionResult,
    };

    return NextResponse.json({ user: userProfile });

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Profile fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// Export the handler wrapped with authentication
export const GET = withAuth(handler); 