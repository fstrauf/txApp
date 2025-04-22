import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

// This handles the API route for /api/user/profile
export async function GET(request: NextRequest) {
  console.log('Attempting to fetch user profile');
  
  try {
    // First, try to get user from NextAuth session
    const session = await getServerSession(authConfig);
    let userId = session?.user?.id;
    
    // If no session, try to get from JWT token in Authorization header
    if (!userId) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
          ) as { id: string; email: string };
          
          userId = decoded.id;
          console.log(`Using JWT token auth for user ID: ${userId}`);
        } catch (jwtError) {
          console.error('JWT verification failed:', jwtError);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    } else {
      console.log(`Using NextAuth session for user ID: ${userId}`);
    }
    
    // If we still don't have a user ID, return unauthorized
    if (!userId) {
      console.log('No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Query user data and their latest subscription details
    const userResult = await db.query.users.findFirst({
      columns: {
        id: true,
        email: true,
        name: true,
        image: true, 
        stripeSubscriptionId: true,
        trialEndsAt: true,
      },
      where: eq(users.id, userId),
    });

    if (!userResult) {
      console.log(`User not found with ID: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subscriptionResult = null;
    if (userResult.stripeSubscriptionId) {
      // Fetch the corresponding subscription details using the ID from the user record
      subscriptionResult = await db.query.subscriptions.findFirst({
        columns: {
          status: true,
          plan: true,
          billingCycle: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
        where: eq(subscriptions.stripeSubscriptionId, userResult.stripeSubscriptionId),
        orderBy: [desc(subscriptions.createdAt)],
      });
    }
    
    // Combine user and subscription data
    const userProfile = {
      ...userResult,
      subscription: subscriptionResult 
    };

    console.log(`Successfully retrieved profile for user ${userId}`);
    return NextResponse.json({ user: userProfile });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 