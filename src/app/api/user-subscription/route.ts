import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { findUserByEmail } from '@/db/utils';
import { hasActiveSubscriptionOrTrial } from '@/lib/authUtils';

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

    // Get user's info with subscription details
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use the utility function to determine active status
    const isActive = hasActiveSubscriptionOrTrial({
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEndsAt: user.currentPeriodEndsAt,
      trialEndsAt: user.trialEndsAt,
    });

    // Return subscription info from the user record
    return NextResponse.json({
      subscriptionPlan: user.subscriptionPlan || 'FREE',
      subscriptionStatus: user.subscriptionStatus || null,
      billingCycle: user.billingCycle || null,
      trialEndsAt: user.trialEndsAt,
      currentPeriodEndsAt: user.currentPeriodEndsAt,
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