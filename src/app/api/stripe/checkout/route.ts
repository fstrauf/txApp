import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createCheckoutSession, createCustomer } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { authConfig } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get plan and billing cycle from query parameters
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan')?.toLowerCase();
    const billingCycle = searchParams.get('billing')?.toLowerCase();
    const redirectPath = searchParams.get('redirect');

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

    // Get user's info
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
      
      // Store the customer ID in the database
      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId));
    }
    
    // --- Construct the success URL based on the redirect parameter --- 
    let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api-key`; // Default
    if (redirectPath && redirectPath.startsWith('/')) { // Basic validation: ensure it's a relative path
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}${redirectPath}`;
    }
    // --- End URL construction --- 
    
    // Create a checkout session, passing the constructed successUrl
    const { sessionId, url } = await createCheckoutSession({
      customerId: stripeCustomerId,
      plan: plan as 'silver' | 'gold',
      billingCycle: billingCycle as 'monthly' | 'annual',
      userId: session.user.id,
      successUrl: successUrl, // Pass the determined success URL
      // cancelUrl could also be made dynamic if needed
    });

    if (!sessionId || !url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // Redirect to the Stripe checkout page
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the checkout session' },
      { status: 500 }
    );
  }
} 