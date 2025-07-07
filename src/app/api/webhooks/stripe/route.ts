import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { users, subscriptions } from '@/db/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig) {
      throw new Error('Missing stripe-signature header');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Handle successful financial snapshot purchase
      if (session.metadata?.product === 'financial-snapshot') {
        console.log('Financial snapshot purchased:', {
          sessionId: session.id,
          customerId: session.customer,
          amount: session.amount_total,
          customerEmail: session.customer_details?.email,
        });
        
        try {
          // Find or create user based on email
          let user = null;
          const customerEmail = session.customer_details?.email;
          
          if (customerEmail) {
            // Try to find existing user by email
            user = await db.query.users.findFirst({
              where: eq(users.email, customerEmail)
            });
            
            // If no user found, create a new one (guest checkout)
            if (!user) {
              const [newUser] = await db.insert(users).values({
                email: customerEmail,
                name: session.customer_details?.name || null,
                stripeCustomerId: session.customer as string || null,
              }).returning();
              user = newUser;
            } else if (!user.stripeCustomerId && session.customer) {
              // Update existing user with Stripe customer ID if missing
              await db.update(users)
                .set({ stripeCustomerId: session.customer as string })
                .where(eq(users.id, user.id));
            }
          }
          
          if (user) {
            // Check if user already has a SNAPSHOT subscription
            const existingSnapshot = await db.query.subscriptions.findFirst({
              where: and(
                eq(subscriptions.userId, user.id),
                eq(subscriptions.plan, 'SNAPSHOT')
              )
            });
            
            if (!existingSnapshot) {
              // Create subscription entry for Financial Snapshot
              const now = new Date();
              const oneYearFromNow = new Date();
              oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
              
              await db.insert(subscriptions).values({
                userId: user.id,
                status: 'ACTIVE',
                plan: 'SNAPSHOT',
                billingCycle: 'ANNUAL', // One-time purchase, treat as annual
                currentPeriodStart: now,
                currentPeriodEnd: oneYearFromNow, // Give them a year of access
                stripeCustomerId: session.customer as string || null,
                stripeSubscriptionId: session.id, // Use session ID as reference
                cancelAtPeriodEnd: true, // It's a one-time purchase
              });
              
              console.log('Financial snapshot subscription created for user:', user.id);
            } else {
              console.log('User already has a Financial Snapshot subscription:', user.id);
            }
          } else {
            console.error('Could not find or create user for Financial Snapshot purchase');
          }
        } catch (error) {
          console.error('Error creating financial snapshot subscription:', error);
        }
      }
      break;
    }
    
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response('Webhook received', { status: 200 });
}
