import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/stripe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { SubscriptionService } from '@/lib/subscriptionService';
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
    console.log(`Processing webhook event: ${event.type}`);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle subscription checkouts
        if (session.mode === 'subscription') {
          // Extract the userId from client_reference_id
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (!userId) {
            console.error("Missing userId in checkout.session.completed event");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
          }
          
          // Update user's Stripe IDs for reference
          await db
            .update(users)
            .set({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            })
            .where(eq(users.id, userId));
          
          console.log(`Updated user ${userId} with Stripe IDs`);
        }
        
        // Handle one-time payments (Financial Snapshot)
        else if (session.mode === 'payment') {
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          const paymentIntentId = session.payment_intent as string;
          
          if (!userId) {
            console.error("Missing userId in one-time payment checkout.session.completed event");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
          }
          
          // Check if this is a financial snapshot payment
          if (session.metadata?.type === 'financial_snapshot') {
            console.log(`Financial Snapshot purchased by user ${userId} for $${session.metadata.amount}`);
            
            // Update user's customer ID if not already set
            const user = await db.query.users.findFirst({
              where: eq(users.id, userId)
            });
            
            if (user && !user.stripeCustomerId) {
              await db
                .update(users)
                .set({ stripeCustomerId: customerId })
                .where(eq(users.id, userId));
            }
            
            // Here you could store the financial snapshot purchase in a separate table
            // or add a field to track one-time purchases
            console.log(`Financial Snapshot payment completed: ${paymentIntentId}`);
          }
        }
        
        break;
      }
       case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by Stripe customer ID 
        const customerId = subscription.customer as string;
        const userToUpdate = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId)
        });
        
        if (!userToUpdate) {
          console.error(`No user found with Stripe customer ID: ${customerId}`);
          break;
        }

        // Update user's Stripe subscription ID for reference
        await db
          .update(users)
          .set({
            stripeSubscriptionId: subscription.id,
          })
          .where(eq(users.id, userToUpdate.id));
        
        // Determine the subscription plan from the actual Stripe Price ID
        let plan: 'GOLD' | 'SILVER' = 'GOLD'; // Default to GOLD
        let billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY'; // Default to MONTHLY
        
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          const priceAmount = subscription.items.data[0].price.unit_amount;
          const interval = subscription.items.data[0].price.recurring?.interval;
          
          console.log(`[Webhook] Subscription details:`, {
            priceId,
            priceAmount,
            priceAmountFormatted: priceAmount ? `$${(priceAmount / 100).toFixed(2)}` : 'null',
            currency: subscription.items.data[0].price.currency,
            interval
          });
          
          // Map based on actual Stripe Price IDs from environment variables
          switch (priceId) {
            case process.env.STRIPE_SILVER_MONTHLY_PRICE_ID:
              plan = 'SILVER';
              billingCycle = 'MONTHLY';
              break;
            case process.env.STRIPE_SILVER_ANNUAL_PRICE_ID:
              plan = 'SILVER';
              billingCycle = 'ANNUAL';
              break;
            case process.env.STRIPE_GOLD_MONTHLY_PRICE_ID:
              plan = 'GOLD';
              billingCycle = 'MONTHLY';
              break;
            case process.env.STRIPE_GOLD_ANNUAL_PRICE_ID:
              plan = 'GOLD';
              billingCycle = 'ANNUAL';
              break;
            default:
              console.warn(`[Webhook] Unknown price ID: ${priceId}, defaulting to GOLD MONTHLY`);
              plan = 'GOLD';
              billingCycle = 'MONTHLY';
          }
          
          console.log(`[Webhook] Mapped price ID ${priceId} to plan: ${plan}, billing: ${billingCycle}`);
        }
        
        // Map Stripe status to our status enum
        let status: 'active' | 'canceled' | 'trialing' = 'active';
        switch (subscription.status) {
          case 'trialing':
          case 'active':
            status = 'active';
            break;
          case 'canceled':
          case 'unpaid':
          case 'incomplete_expired':
          case 'past_due':
            status = 'canceled';
            break;
          default:
            status = 'active';
        }

        // For new subscriptions, create a subscription record
        if (event.type === 'customer.subscription.created') {
          await SubscriptionService.createSubscription({
            userId: userToUpdate.id,
            plan,
            billingCycle, // Use the billingCycle we determined above
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            trialDays: subscription.trial_end ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
          });
          console.log(`[Webhook] Created new ${plan} ${billingCycle} subscription for user ${userToUpdate.id}`);
        } else {
          // For updates, use updateFromStripe with the correct signature
          await SubscriptionService.updateFromStripe(subscription.id, {
            status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
          console.log(`Updated subscription for user ${userToUpdate.id} via SubscriptionService`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by Stripe subscription ID
        const userToUpdate = await db.query.users.findFirst({
          where: eq(users.stripeSubscriptionId, subscription.id)
        });
        
        if (userToUpdate) {
          // Use SubscriptionService to handle cancellation with correct signature
          await SubscriptionService.updateFromStripe(subscription.id, {
            status: 'canceled',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: true,
          });
          
          // Remove API key from user since subscription is canceled
          await db
            .update(users)
            .set({
              api_key: null,
            })
            .where(eq(users.id, userToUpdate.id));
          
          console.log(`Subscription ${subscription.id} canceled for user ${userToUpdate.id}`);
        } else {
          console.error(`No user found with Stripe subscription ID: ${subscription.id}`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
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