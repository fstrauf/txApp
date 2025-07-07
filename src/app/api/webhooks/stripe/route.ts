import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

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
        
        // Here you could:
        // 1. Save the purchase to your database
        // 2. Send confirmation email
        // 3. Grant access to premium features
        // 4. Send analytics event
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
