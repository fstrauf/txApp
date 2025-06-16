import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's spreadsheet info
    const user = await db
      .select({
        spreadsheetId: users.spreadsheetId,
        spreadsheetUrl: users.spreadsheetUrl,
        oauthRefreshToken: users.oauthRefreshToken,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    if (!userData.spreadsheetId || !userData.spreadsheetUrl) {
      return NextResponse.json(
        { error: 'No spreadsheet linked. Please link a spreadsheet first.' },
        { status: 400 }
      );
    }

    // TODO: Implement actual spreadsheet reading via OAuth
    // For now, return mock data to test the frontend
    const mockStats = {
      monthlyAverageIncome: 4200,
      monthlyAverageSavings: 1100,
      monthlyAverageExpenses: 3100,
      lastMonthExpenses: 3250,
      annualExpenseProjection: 37200,
      lastDataRefresh: new Date(),
    };

    // Update last refresh timestamp
    await db
      .update(users)
      .set({ lastDataRefresh: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      stats: mockStats,
      message: 'Dashboard data refreshed successfully',
    });

  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to refresh dashboard data' },
      { status: 500 }
    );
  }
} 