import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SubscriptionManager } from '@/lib/subscriptionManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionStatus, subscriptionPlan, trialEndsAt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Updating subscription for user ID: ${userId}`);
    console.log(`New status: ${subscriptionStatus}, plan: ${subscriptionPlan}`);

    // Find user by userId
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use SubscriptionManager to handle subscription updates
    let subscription;
    
    if (subscriptionStatus === 'TRIALING') {
      // Start a trial - if trialEndsAt is provided, calculate days from now
      let trialDurationDays = 14; // default
      if (trialEndsAt) {
        const trialEndDate = new Date(trialEndsAt);
        const now = new Date();
        trialDurationDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDurationDays = Math.max(1, trialDurationDays); // Ensure at least 1 day
      }
      
      subscription = await SubscriptionManager.startTrial(
        userId,
        subscriptionPlan || 'SILVER',
        trialDurationDays
      );
    } else if (subscriptionStatus === 'RESET' || subscriptionStatus === 'FREE') {
      // For FREE status, we can just cancel all existing subscriptions
      const currentSub = await SubscriptionManager.getCurrentSubscription(userId);
      if (currentSub) {
        await SubscriptionManager.cancelSubscription(userId);
      }
      // Return a basic FREE subscription representation
      subscription = {
        plan: 'SILVER', // Will be ignored for display
        status: 'CANCELED',
        billingCycle: 'MONTHLY',
        userId
      };
    } else {
      // For valid subscription statuses, upsert with SubscriptionManager
      subscription = await SubscriptionManager.upsertSubscription({
        userId,
        status: subscriptionStatus as 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE',
        plan: (subscriptionPlan || 'SILVER') as 'SILVER' | 'GOLD',
        billingCycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    console.log(`Subscription updated successfully for user ${userId}`);
    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error updating user subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to update user subscription', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 