import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { SubscriptionService } from '@/lib/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[API /user/start-trial] Starting trial for user: ${session.user.id}`);

    // Check if user already has access
    const accessCheck = await SubscriptionService.hasAccess(session.user.id);
    if (accessCheck.hasAccess) {
      return NextResponse.json({ 
        error: 'User already has access',
        reason: accessCheck.reason 
      }, { status: 400 });
    }

    // Start trial using the service
    const subscription = await SubscriptionService.startTrial(session.user.id);

    console.log(`[API /user/start-trial] Trial started successfully for user: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      subscription,
      message: '14-day trial started successfully'
    });

  } catch (error) {
    console.error('[API /user/start-trial] Error starting trial:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start trial',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 