import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscriptionService';

export const preferredRegion = 'fra1';

export async function POST(request: NextRequest) {
  // Get session using NextAuth
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Use SubscriptionService to cancel the subscription
    await SubscriptionService.cancelSubscription(userId);

    console.log(`Subscription cancelled successfully for user ${userId}`);
    return NextResponse.json({ 
        message: 'Subscription cancellation initiated successfully. It will remain active until the end of the current billing period.' 
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during subscription cancellation');
    console.error('Subscription cancellation error:', error.message);
    
    // Provide a more specific error message if possible, default to 500
    const errorMessage = error.message.includes('No such subscription') 
      ? 'Could not find the specified subscription to cancel.' 
      : 'Failed to cancel subscription.';
    const status = error.message.includes('No such subscription') ? 404 : 500;
      
    return NextResponse.json({ error: errorMessage }, { status });
  }
}