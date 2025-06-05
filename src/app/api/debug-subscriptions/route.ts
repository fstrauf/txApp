import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG SUBSCRIPTIONS ENDPOINT ===');
    
    // Get all subscriptions ordered by latest
    const allSubs = await db.select().from(subscriptions).orderBy(desc(subscriptions.updatedAt));

    console.log('\nAll subscriptions:');
    const debugData = {
      allSubscriptions: allSubs.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        plan: sub.plan,
        status: sub.status,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })),
      userSpecificSubs: []
    };

    // Get subscription for specific user (appears to be n854i3yghgoflvccvujy)
    const userSubs = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, 'n854i3yghgoflvccvujy'))
      .orderBy(desc(subscriptions.updatedAt));

    debugData.userSpecificSubs = userSubs.map(sub => ({
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      updatedAt: sub.updatedAt
    }));

    console.log('Debug data collected:', debugData);
    
    return NextResponse.json(debugData);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch debug data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
