import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('=== DEBUG SUBSCRIPTIONS ENDPOINT ===');
    
    // Get all subscriptions
    const allSubs = await db.select().from(subscriptions).orderBy(desc(subscriptions.updatedAt));
    
    // Get all users with subscription info
    const allUsers = await db.select().from(users);
    
    let userSpecific = null;
    let userCurrentSub = null;
    
    if (userId) {
      // Get specific user's subscriptions
      userSpecific = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.updatedAt));
        
      // Get current subscription via SubscriptionService
      userCurrentSub = await SubscriptionService.getCurrentSubscription(userId);
    }

    const debugData = {
      timestamp: new Date().toISOString(),
      totalSubscriptions: allSubs.length,
      totalUsers: allUsers.length,
      allSubscriptions: allSubs.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        plan: sub.plan,
        status: sub.status,
        billingCycle: sub.billingCycle,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })),
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        api_key: user.api_key ? 'SET' : 'NULL'
      })),
      ...(userId && {
        queriedUserId: userId,
        userSubscriptions: userSpecific,
        currentSubscriptionViaService: userCurrentSub
      })
    };

    return NextResponse.json(debugData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
