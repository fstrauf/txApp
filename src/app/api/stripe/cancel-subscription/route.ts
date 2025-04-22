import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cancelSubscription as stripeCancelSubscription } from '@/lib/stripe';
import { withAuth } from '@/lib/authUtils';
import type { JwtPayload } from '@/lib/authUtils';

export const runtime = 'edge';
export const preferredRegion = 'fra1';

// Define the actual handler logic
async function handler(request: NextRequest, payload: JwtPayload) {
  try {
    const userId = payload.id;

    // Find user to get their Stripe subscription ID
    const userRecord = await db.query.users.findFirst({
      columns: {
        stripeSubscriptionId: true
      },
      where: eq(users.id, userId)
    });

    if (!userRecord || !userRecord.stripeSubscriptionId) {
      console.error(`User ${userId} does not have a Stripe subscription ID for cancellation.`);
      // Use 400 Bad Request might be slightly more appropriate than 404 if user exists but has no sub ID
      return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 400 });
    }

    const stripeSubscriptionId = userRecord.stripeSubscriptionId;

    // Call Stripe to cancel the subscription at the period end
    await stripeCancelSubscription(stripeSubscriptionId);

    // Update the subscription record in our database to reflect cancellation pending
    await db.update(subscriptions)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    console.log(`Subscription ${stripeSubscriptionId} marked for cancellation at period end for user ${userId}.`);
    return NextResponse.json({ 
        message: 'Subscription cancellation initiated successfully. It will remain active until the end of the current billing period.' 
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during subscription cancellation');
    console.error('Subscription cancellation error:', error.message);
    
    // Provide a more specific error message if possible, default to 500
    const errorMessage = error.message.includes('No such subscription') 
      ? 'Could not find the specified subscription to cancel.' 
      : 'Failed to cancel subscription.';
    const status = error.message.includes('No such subscription') ? 404 : 500; // Use 404 if Stripe couldn't find it
      
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

// Export the handler wrapped with authentication
export const POST = withAuth(handler); 