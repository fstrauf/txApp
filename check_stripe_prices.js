// Quick script to check your Stripe prices
// Run this to see all your price IDs and amounts

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function listPrices() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring'
    });
    
    console.log('Active subscription prices:');
    prices.data.forEach(price => {
      console.log({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        formatted: `${price.currency.toUpperCase()} ${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}`,
        product: price.product
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listPrices();
