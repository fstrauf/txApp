import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch the user's monthly reminder toast status
    const user = await db
      .select({ monthlyReminderToastStatus: users.monthlyReminderToastStatus })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    const status = user[0]?.monthlyReminderToastStatus || null;

    return NextResponse.json({ status });

  } catch (error) {
    console.error('Error fetching monthly reminder toast status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { status } = await request.json();
    
    if (!status || !['DISMISSED', 'SET_REMINDER'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the user's monthly reminder toast status
    await db
      .update(users)
      .set({ 
        monthlyReminderToastStatus: status,
        updatedAt: new Date()
      })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ 
      success: true, 
      message: `Monthly reminder toast status updated to ${status}` 
    });

  } catch (error) {
    console.error('Error updating monthly reminder toast status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
} 