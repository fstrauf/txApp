import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    const paid = session.payment_status === 'paid';
    const isFinancialSnapshot = session.metadata?.type === 'financial_snapshot';

    if (!paid) {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    if (!isFinancialSnapshot) {
      return NextResponse.json(
        { error: 'Not a Financial Snapshot purchase' },
        { status: 400 }
      );
    }

    // Return verification details
    return NextResponse.json({
      paid: true,
      email: session.customer_details?.email,
      customerName: session.customer_details?.name,
      customerId: session.customer as string,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency,
      created: session.created,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 