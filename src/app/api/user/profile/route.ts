import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withAuth } from '@/lib/authUtils';
import type { JwtPayload } from '@/lib/authUtils';

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
        api_key: true,
        lunchMoneyApiKey: true,
        appBetaOptIn: true,
      },
      where: eq(users.id, userId),
    });

    if (!userResult) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all subscriptions for the user and prioritize them correctly
    // Priority: ACTIVE paid subscriptions > TRIALING > others > most recent by updatedAt
    const allSubscriptions = await db.query.subscriptions.findMany({
      columns: {
        status: true,
        plan: true,
        billingCycle: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
      },
      where: eq(subscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
    });

    // Find the best subscription based on priority
    let subscriptionResult = null;
    if (allSubscriptions.length > 0) {
      // First, look for ACTIVE paid subscriptions
      const activeSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'ACTIVE' && 
        sub.currentPeriodEnd && 
        new Date(sub.currentPeriodEnd) > new Date()
      );
      
      if (activeSubscriptions.length > 0) {
        subscriptionResult = activeSubscriptions[0]; // Take the first ACTIVE one
      } else {
        // If no ACTIVE, look for TRIALING
        const trialingSubscriptions = allSubscriptions.filter(sub => 
          sub.status === 'TRIALING' && 
          sub.trialEndsAt && 
          new Date(sub.trialEndsAt) > new Date()
        );
        
        if (trialingSubscriptions.length > 0) {
          subscriptionResult = trialingSubscriptions[0]; // Take the first TRIALING one
        } else {
          // Otherwise, take the most recent one
          subscriptionResult = allSubscriptions[0];
        }
      }
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