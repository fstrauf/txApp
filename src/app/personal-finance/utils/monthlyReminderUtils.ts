import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserMonthlyReminderToastStatus(userEmail: string): Promise<string | null> {
  try {
    const user = await db
      .select({ monthlyReminderToastStatus: users.monthlyReminderToastStatus })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    return user[0]?.monthlyReminderToastStatus || null;
  } catch (error) {
    console.error('Error fetching user monthly reminder toast status:', error);
    return null;
  }
} 