import Stripe from 'stripe';

// Make sure environment variables are properly typed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia', // Use a valid API version
});

export type SubscriptionPlan = 'silver' | 'gold';
export type BillingCycle = 'monthly' | 'annual';

// Define pricing for subscription plans
export const PLANS = {
  silver: {
    monthly: {
      priceId: process.env.STRIPE_SILVER_MONTHLY_PRICE_ID,
      amount: 200, // $2.00 in cents
    },
    annual: {
      priceId: process.env.STRIPE_SILVER_ANNUAL_PRICE_ID,
      amount: 1920, // $19.20 in cents (20% discount)
    }
  },
  gold: {
    monthly: {
      priceId: process.env.STRIPE_GOLD_MONTHLY_PRICE_ID,
      amount: 1000, // $10.00 in cents
    },
    annual: {
      priceId: process.env.STRIPE_GOLD_ANNUAL_PRICE_ID,
      amount: 9600, // $96.00 in cents (20% discount)
    }
  }
};

// Create a checkout session for subscription
export async function createCheckoutSession({
  customerId,
  priceId,
  plan,
  billingCycle,
  userId,
  successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api-key`,
  cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
}: {
  customerId?: string;
  priceId?: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  try {
    // If we don't have a priceId, use the configured price IDs
    const finalPriceId = priceId || PLANS[plan][billingCycle].priceId;
    
    // If we don't have a priceId configured in env, throw an error
    if (!finalPriceId) {
      throw new Error(`No price ID configured for ${plan} ${billingCycle} plan`);
    }

    // Create checkout session with or without a customer ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          plan,
          billingCycle,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        plan,
        billingCycle,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create a customer in Stripe
export async function createCustomer({
  email,
  name,
  metadata
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Update a subscription
export async function updateSubscription({
  subscriptionId,
  plan,
  billingCycle,
}: {
  subscriptionId: string;
  plan?: SubscriptionPlan;
  billingCycle?: BillingCycle;
}) {
  try {
    // Find existing subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // If we want to change the plan or billing cycle, get the new price ID
    if (plan && billingCycle) {
      const priceId = PLANS[plan][billingCycle].priceId;
      
      if (!priceId) {
        throw new Error(`No price ID configured for ${plan} ${billingCycle} plan`);
      }
      
      // Update subscription with new price
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
        metadata: {
          ...subscription.metadata,
          plan,
          billingCycle,
        },
      });
    }
    
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Cancel a subscription (at the end of the current period)
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Handle Stripe webhook events
export async function handleWebhookEvent(rawBody: string, signature: string) {
  try {
    // Verify and construct event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log(`Processing webhook event: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment successful, subscription created
        break;
        
      case 'customer.subscription.created':
        // Subscription was created
        break;
        
      case 'customer.subscription.updated':
        // Subscription was updated
        break;
        
      case 'customer.subscription.deleted':
        // Subscription was canceled or ended
        break;
        
      case 'invoice.payment_succeeded':
        // Invoice was paid
        break;
        
      case 'invoice.payment_failed':
        // Payment failed
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return event;
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Create a one-time checkout session (for Financial Snapshot)
export async function createOneTimeCheckoutSession({
  customerId,
  amount,
  productName = 'Financial Snapshot',
  description = 'Complete financial analysis with personalized insights',
  userId,
  successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/personal-finance?snapshot=success`,
  cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/personal-finance`
}: {
  customerId?: string;
  amount: number; // Amount in cents
  productName?: string;
  description?: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        type: 'financial_snapshot',
        amount: amount.toString(),
        userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating one-time checkout session:', error);
    throw error;
  }
}

export default stripe;