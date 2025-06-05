import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function GET(request: Request) {
  // 1. Secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Expire subscriptions: Unauthorized attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron job: Expire subscriptions starting...');

  try {
    // 2. Use SubscriptionService to expire overdue subscriptions
    const expiredCount = await SubscriptionService.expireOverdueSubscriptions();

    if (expiredCount > 0) {
       console.log(`Cron job: Successfully expired ${expiredCount} subscriptions.`);
    } else {
       console.log('Cron job: No overdue subscriptions found to process.');
    }

    return NextResponse.json({ 
      success: true, 
      expiredSubscriptions: expiredCount,
      message: `Processed ${expiredCount} overdue subscriptions`
    });

  } catch (error) {
    console.error("Cron job 'expire-subscriptions' failed:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 