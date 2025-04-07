import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Use getServerSession
import { authConfig } from '@/lib/auth'; // Import authConfig
import { db } from '@/db';
import { accounts, appBetaOptInStatusEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  // Get session using getServerSession and authConfig
  const session = await getServerSession(authConfig); 

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let status: (typeof appBetaOptInStatusEnum.enumValues)[number];

  try {
    const body = await request.json();
    if (!body.status || !appBetaOptInStatusEnum.enumValues.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status provided. Must be OPTED_IN or DISMISSED.' }, { status: 400 });
    }
    status = body.status;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const updatedAccounts = await db
      .update(accounts)
      .set({ appBetaOptIn: status })
      .where(eq(accounts.userId, userId))
      .returning({ accountId: accounts.id, appBetaOptIn: accounts.appBetaOptIn });

    if (updatedAccounts.length === 0) {
      // This case should ideally not happen for a logged-in user unless their account record is missing
      console.warn(`No accounts found for user ${userId} to update beta opt-in status.`);
      // Depending on requirements, you might return an error or just an empty success
      return NextResponse.json({ message: 'No accounts found for user to update.' }, { status: 404 }); 
    }

    console.log(`Updated appBetaOptIn status to ${status} for user ${userId}, accounts: ${updatedAccounts.map(a => a.accountId).join(', ')}`);

    // Return the status of the first updated account as confirmation, or a generic success message
    return NextResponse.json({ 
      message: 'Beta opt-in status updated successfully',
      updatedStatus: updatedAccounts[0]?.appBetaOptIn 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating appBetaOptIn status:', error);
    return NextResponse.json({ error: 'Failed to update beta opt-in status' }, { status: 500 });
  }
} 