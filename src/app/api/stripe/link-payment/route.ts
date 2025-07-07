import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
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