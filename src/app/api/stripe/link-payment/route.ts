import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { users, subscriptions } from '@/db/schema';
import { authConfig } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!stripeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify payment was successful and is for Financial Snapshot
    if (stripeSession.payment_status !== 'paid' || stripeSession.metadata?.type !== 'financial_snapshot') {
      return NextResponse.json(
        { error: 'Invalid or unpaid session' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const customerId = stripeSession.customer as string;
    const customerEmail = stripeSession.customer_details?.email;

    // Get user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify email matches (security check)
    if (customerEmail && userRecord.email !== customerEmail) {
      return NextResponse.json(
        { error: 'Email mismatch - this purchase belongs to a different email address' },
        { status: 403 }
      );
    }

    // Update user with Stripe customer ID if not already set
    if (!userRecord.stripeCustomerId) {
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, userId));
    }

    // Create a subscription record for the snapshot purchase
    // Check if user already has an active snapshot subscription
    const existingSnapshot = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.plan, 'SNAPSHOT'),
        eq(subscriptions.status, 'ACTIVE')
      ),
    });

    if (!existingSnapshot) {
      // Create subscription record for snapshot access
      // Snapshot is a one-time purchase, so we give it a long validity period
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      await db.insert(subscriptions).values({
        userId: userId,
        status: 'ACTIVE',
        plan: 'SNAPSHOT',
        billingCycle: 'MONTHLY', // Required field, but not really applicable for one-time purchase
        currentPeriodStart: now,
        currentPeriodEnd: oneYearFromNow, // Give them access for a year
        stripeCustomerId: customerId,
        // Note: We don't set stripeSubscriptionId since this is a one-time payment, not a recurring subscription
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now
      });

      console.log(`Created SNAPSHOT subscription record for user ${userId}`);
    } else {
      console.log(`User ${userId} already has an active SNAPSHOT subscription, not creating duplicate`);
    }

    console.log(`Linked Financial Snapshot payment session ${sessionId} to user ${userId}`);

    return NextResponse.json({
      success: true,
      linked: true,
      amount: stripeSession.amount_total ? stripeSession.amount_total / 100 : null,
      currency: stripeSession.currency
    });

  } catch (error) {
    console.error('Error linking payment to user:', error);
    return NextResponse.json(
      { error: 'Failed to link payment to account' },
      { status: 500 }
    );
  }
} 