import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripe';
import { db } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { accounts, subscriptions, billingCycleEnum, subscriptionPlanEnum, subscriptionStatusEnum } from '@/db/schema';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body
    const rawBody = await request.text();
    // Get the Stripe signature from the headers
    const signature = request.headers.get('stripe-signature') as string;

    if (!signature) {
      console.error('No Stripe signature found in request headers');
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    // Process the webhook event
    const event = await handleWebhookEvent(rawBody, signature);

    // Handle the specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Make sure this is a subscription checkout
        if (session.mode !== 'subscription') break;
        
        // Find the customer and subscription data
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        // Get plan and billing cycle from session metadata
        const plan = (session.metadata?.plan || 'silver').toUpperCase();
        const billingCycle = (session.metadata?.billingCycle || 'monthly').toUpperCase();
        
        // Find the user account by the Stripe customer ID
        const userAccount = await db.query.accounts.findFirst({
          where: eq(accounts.stripeCustomerId, customerId)
        });
        
        if (!userAccount) {
          console.error(`No user account found with Stripe customer ID: ${customerId}`);
          break;
        }
        
        // Update the account with subscription information
        await db
          .update(accounts)
          .set({
            subscriptionPlan: plan as any,
            subscriptionStatus: 'TRIALING' as any,
            billingCycle: billingCycle as any,
            stripeSubscriptionId: subscriptionId,
            // For trials, we'll set these during the subscription created/updated events
          })
          .where(eq(accounts.id, userAccount.id));
        
        console.log(`Updated user account ${userAccount.id} with subscription ${subscriptionId}`);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the user account by Stripe customer ID
        const customerId = subscription.customer as string;
        
        const userAccount = await db.query.accounts.findFirst({
          where: eq(accounts.stripeCustomerId, customerId)
        });
        
        if (!userAccount) {
          console.error(`No user account found with Stripe customer ID: ${customerId}`);
          break;
        }
        
        // Extract the subscription metadata
        const plan = ((subscription.metadata?.plan || 'silver') as string).toUpperCase();
        const billingCycle = ((subscription.metadata?.billingCycle || 'monthly') as string).toUpperCase();

        // Determine the subscription status
        let status: string;
        switch (subscription.status) {
          case 'trialing':
            status = 'TRIALING';
            break;
          case 'active':
            status = 'ACTIVE';
            break;
          case 'past_due':
            status = 'PAST_DUE';
            break;
          case 'canceled':
            status = 'CANCELED';
            break;
          default:
            status = 'ACTIVE';
        }
        
        // Get current timestamp and format for database
        const now = new Date();
        
        // Update the account with subscription details
        await db
          .update(accounts)
          .set({
            subscriptionPlan: plan as any,
            subscriptionStatus: status as any,
            billingCycle: billingCycle as any,
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            currentPeriodEndsAt: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(accounts.id, userAccount.id));
        
        // Create/update a record in the subscriptions table
        const existingSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id)
        });
        
        if (existingSubscription) {
          // Update existing subscription record
          await db
            .update(subscriptions)
            .set({
              status: status as any,
              plan: plan as any,
              billingCycle: billingCycle as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: now
            })
            .where(eq(subscriptions.id, existingSubscription.id));
        } else {
          // Create a new subscription record
          await db.insert(subscriptions).values({
            userId: userAccount.userId,
            accountId: userAccount.id,
            status: status as any,
            plan: plan as any,
            billingCycle: billingCycle as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            createdAt: now,
            updatedAt: now
          });
        }
        
        console.log(`Updated subscription information for user ${userAccount.id}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the user account by Stripe subscription ID
        const userAccount = await db.query.accounts.findFirst({
          where: eq(accounts.stripeSubscriptionId, subscription.id)
        });
        
        if (!userAccount) {
          console.error(`No user account found with Stripe subscription ID: ${subscription.id}`);
          break;
        }
        
        // Reset the account to FREE plan
        await db
          .update(accounts)
          .set({
            subscriptionPlan: 'FREE' as any,
            subscriptionStatus: 'CANCELED' as any,
            // Keep the customer ID for future subscriptions
          })
          .where(eq(accounts.id, userAccount.id));
        
        // Update the subscription record if it exists
        const existingSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id)
        });
        
        if (existingSubscription) {
          await db
            .update(subscriptions)
            .set({
              status: 'CANCELED' as any,
              cancelAtPeriodEnd: true,
              updatedAt: new Date()
            })
            .where(eq(subscriptions.id, existingSubscription.id));
        }
        
        console.log(`Subscription ${subscription.id} has been canceled for user ${userAccount.id}`);
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Configure the API route to accept raw body
export const config = {
  api: {
    bodyParser: false,
  },
}; 