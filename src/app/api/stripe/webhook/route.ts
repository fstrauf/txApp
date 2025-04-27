import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripe';
import { db } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { users, accounts, subscriptions, billingCycleEnum, subscriptionPlanEnum, subscriptionStatusEnum } from '@/db/schema';
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
        
        // Extract the userId from client_reference_id
        const userId = session.client_reference_id;

        if (!userId) {
          console.error("Missing userId in checkout.session.completed event");
          return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }
        
        // First find user with this Stripe customer ID
        let userToUpdate = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId)
        });
        
        if (!userToUpdate) {
          // If not found directly in user table, try looking up through accounts
          const userAccount = await db.query.accounts.findFirst({
            columns: {
              userId: true,
            },
            with: {
              user: true
            },
            where: eq(accounts.userId, accounts.userId) // Placeholder - will be fixed in more comprehensive solution
          });
          
          if (!userAccount) {
            console.error(`No user found with Stripe customer ID: ${customerId}`);
            break;
          }
          
          userToUpdate = userAccount.user;
        }
        
        // Update user's subscription information
        await db
          .update(users)
          .set({
            subscriptionPlan: plan as any,
            subscriptionStatus: 'TRIALING' as any,
            billingCycle: billingCycle as any,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            // For trials, we'll set these during the subscription created/updated events
          })
          .where(eq(users.id, userToUpdate.id));
        
        console.log(`Updated user ${userToUpdate.id} with subscription ${subscriptionId}`);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by Stripe customer ID 
        const customerId = subscription.customer as string;
        
        // Look up user directly
        let userToUpdate = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId)
        });
        
        if (!userToUpdate) {
          console.error(`No user found with Stripe customer ID: ${customerId}`);
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
        
        // Update user with subscription details
        await db
          .update(users)
          .set({
            subscriptionPlan: plan as any,
            subscriptionStatus: status as any,
            billingCycle: billingCycle as any,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            currentPeriodEndsAt: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(users.id, userToUpdate.id));
        
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
          // Find a valid account for this user
          const userAccount = await db.query.accounts.findFirst({
            where: eq(accounts.userId, userToUpdate.id)
          });
          
          if (userAccount) {
            // Create a new subscription record only if we found a valid account
            await db.insert(subscriptions).values({
              userId: userToUpdate.id,
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
          } else {
            console.log(`Skipping subscription record creation - no valid account found for user ${userToUpdate.id}`);
          }
        }
        
        console.log(`Updated subscription information for user ${userToUpdate.id}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by Stripe subscription ID
        const userToUpdate = await db.query.users.findFirst({
          where: eq(users.stripeSubscriptionId, subscription.id)
        });
        
        if (!userToUpdate) {
          console.error(`No user found with Stripe subscription ID: ${subscription.id}`);
          break;
        }
        
        // Reset the user's subscription and remove API key
        await db
          .update(users)
          .set({
            subscriptionPlan: 'FREE' as any,
            subscriptionStatus: 'CANCELED' as any,
            api_key: null, // Remove the API key
            // Keep the customer ID for future subscriptions
          })
          .where(eq(users.id, userToUpdate.id));
        
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
        
        console.log(`Subscription ${subscription.id} has been canceled for user ${userToUpdate.id}`);
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