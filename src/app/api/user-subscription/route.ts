import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findUserByEmail } from '@/db/utils';

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

    // Return subscription info from the user record
    return NextResponse.json({
      subscriptionPlan: user.subscriptionPlan || 'FREE',
      subscriptionStatus: user.subscriptionStatus || null,
      billingCycle: user.billingCycle || null,
      trialEndsAt: user.trialEndsAt,
      currentPeriodEndsAt: user.currentPeriodEndsAt,
      hasActiveSubscription: ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus || ''),
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    );
  }
} 