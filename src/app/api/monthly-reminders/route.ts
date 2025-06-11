import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyReminders, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to set up monthly reminders.' },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found. Please create an account first.' },
        { status: 404 }
      );
    }

    const userId = user[0].id;

    // Check if reminder already exists for this user
    const existingReminder = await db
      .select()
      .from(monthlyReminders)
      .where(eq(monthlyReminders.userId, userId))
      .limit(1);

    const now = new Date();
    const nextSend = getFirstDayOfNextMonth();

    if (existingReminder.length > 0) {
      // Update existing reminder
      await db
        .update(monthlyReminders)
        .set({
          isActive: true,
          nextSend: nextSend,
          updatedAt: now,
        })
        .where(eq(monthlyReminders.userId, userId));

      return NextResponse.json({
        message: 'Monthly reminder updated successfully',
        email: session.user.email,
      });
    } else {
      // Create new reminder
      await db.insert(monthlyReminders).values({
        userId: userId,
        isActive: true,
        nextSend: nextSend,
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        message: 'Monthly reminder created successfully',
        email: session.user.email,
      });
    }
  } catch (error: any) {
    console.error('Error managing monthly reminder:', error);
    return NextResponse.json(
      { error: 'Failed to set up monthly reminder' },
      { status: 500 }
    );
  }
}

// Helper function to get the first day of next month
function getFirstDayOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0); // 9 AM on 1st of next month
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user[0].id;

    // Deactivate the reminder instead of deleting it
    await db
      .update(monthlyReminders)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(monthlyReminders.userId, userId));

    return NextResponse.json({
      message: 'Monthly reminder unsubscribed successfully',
    });
  } catch (error: any) {
    console.error('Error unsubscribing from monthly reminder:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from monthly reminder' },
      { status: 500 }
    );
  }
} 