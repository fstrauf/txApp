import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db
      .select({
        spreadsheetUrl: users.spreadsheetUrl,
        spreadsheetId: users.spreadsheetId,
        lastDataRefresh: users.lastDataRefresh,
        emailRemindersEnabled: users.emailRemindersEnabled,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // If user has spreadsheet linked, we could fetch basic stats here
    // For now, just return the spreadsheet status
    return NextResponse.json({
      spreadsheetUrl: userData.spreadsheetUrl,
      spreadsheetId: userData.spreadsheetId,
      lastDataRefresh: userData.lastDataRefresh,
      emailRemindersEnabled: userData.emailRemindersEnabled,
      hasSpreadsheet: !!userData.spreadsheetUrl,
      // TODO: Add actual stats calculation from spreadsheet
      stats: userData.spreadsheetUrl ? {
        monthlyAverageIncome: 0,
        monthlyAverageSavings: 0,
        monthlyAverageExpenses: 0,
        lastMonthExpenses: 0,
        annualExpenseProjection: 0,
        lastDataRefresh: userData.lastDataRefresh,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching dashboard status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard status' },
      { status: 500 }
    );
  }
} 