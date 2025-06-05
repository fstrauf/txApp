import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { findUserByEmail } from '@/db/utils';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's info
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use SubscriptionService to get current subscription
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);

    // If no subscription found, return default FREE plan
    if (!subscription) {
      return NextResponse.json({
        subscriptionPlan: 'FREE',
        subscriptionStatus: null,
        billingCycle: null,
        trialEndsAt: null,
        currentPeriodEndsAt: null,
        hasActiveSubscription: false,
      });
    }

    // Determine if subscription is active (using our simplified status enum)
    const isActive = subscription.status === 'ACTIVE';

    // Return subscription info
    return NextResponse.json({
      subscriptionPlan: subscription.plan || 'FREE',
      subscriptionStatus: subscription.status,
      billingCycle: subscription.billingCycle,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEndsAt: subscription.currentPeriodEnd,
      hasActiveSubscription: isActive,
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    );
  }
} 