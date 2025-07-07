import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Stripe from 'stripe';
import { createCheckoutSession, createOneTimeCheckoutSession, createCustomer } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { authConfig } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(request: NextRequest) {
  try {
    // Get plan and billing cycle from query parameters
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan')?.toLowerCase();
    const billingCycle = searchParams.get('billing')?.toLowerCase();
    const redirectPath = searchParams.get('redirect');

    // Handle Financial Snapshot one-time payment (no auth required)
    if (plan === 'snapshot' && billingCycle === 'one-time') {
      // Construct the success URL
      let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/personal-finance?snapshot=success`;
      let cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/personal-finance?snapshot=cancelled`;
      
      if (redirectPath && redirectPath.startsWith('/')) {
        // Check if redirectPath already has query parameters
        const separator = redirectPath.includes('?') ? '&' : '?';
        successUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}${separator}snapshot=success`;
        cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}${separator}snapshot=cancelled`;
      }

      // Create checkout session using Stripe Price ID
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: process.env.STRIPE_FINANCIAL_SNAPSHOT_PRICE_ID,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          product: 'financial-snapshot',
          type: 'financial_snapshot',
          amount: '49'
        },
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
        customer_creation: 'always', // Always create a Stripe customer for guest purchases
      });

      if (!session.id || !session.url) {
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: session.url });
    }

    // For subscription plans, check if user is authenticated
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required for subscription plans' },
        { status: 401 }
      );
    }

    // Validate plan and billing cycle for subscriptions
    if (!plan || !['silver', 'gold'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan specified' },
        { status: 400 }
      );
    }

    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle specified' },
        { status: 400 }
      );
    }

    // Get user's info for subscriptions
    const userId = session.user.id;
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    let stripeCustomerId = userRecord?.stripeCustomerId;

    // If user doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await createCustomer({
        email: session.user.email || '',
        name: session.user.name || undefined,
        metadata: {
          userId: userId
        }
      });
      stripeCustomerId = customer.id;

      // Update user record with Stripe customer ID
      await db.update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, userId));
    }

    // Construct the success URL
    let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api-key`; // Default
    if (redirectPath && redirectPath.startsWith('/')) {
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}`;
    }

    // Create a checkout session for subscription plans
    const { sessionId, url } = await createCheckoutSession({
      customerId: stripeCustomerId,
      plan: plan as 'silver' | 'gold',
      billingCycle: billingCycle as 'monthly' | 'annual',
      userId: session.user.id,
      successUrl: successUrl,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    });

    if (!sessionId || !url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the checkout session' },
      { status: 500 }
    );
  }
} 