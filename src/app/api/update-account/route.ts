import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionStatus, subscriptionPlan, trialEndsAt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Updating subscription for user ID: ${userId}`);
    console.log(`New status: ${subscriptionStatus}, plan: ${subscriptionPlan}`);

    // Find user by userId
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user with subscription details
    const updateValues: any = {};
    
    if (subscriptionStatus) {
      if (subscriptionStatus === 'RESET') {
        // Special case to reset subscription status to null
        updateValues.subscriptionStatus = null;
      } else {
        updateValues.subscriptionStatus = subscriptionStatus;
      }
    }
    
    if (subscriptionPlan) {
      updateValues.subscriptionPlan = subscriptionPlan;
    }
    
    if (trialEndsAt) {
      updateValues.trialEndsAt = new Date(trialEndsAt);
    } else if (subscriptionStatus === 'TRIALING') {
      // Set trial end to 14 days from now if status is TRIALING
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      updateValues.trialEndsAt = trialEnd;
    }
    
    const result = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning();
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to update user subscription', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 