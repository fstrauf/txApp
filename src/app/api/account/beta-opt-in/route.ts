import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Use getServerSession
import { authConfig } from '@/lib/auth'; // Import authConfig
import { db } from '@/db';
import { accounts, appBetaOptInStatusEnum, users } from '@/db/schema';
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
    // Update the USERS table now
    const updatedUsers = await db
      .update(users) // Target the users table
      .set({ appBetaOptIn: status })
      .where(eq(users.id, userId))
      .returning({ userId: users.id, appBetaOptIn: users.appBetaOptIn });

    // Check if the user record itself was found and updated
    if (updatedUsers.length === 0) {
      console.warn(`User record not found for user ${userId} to update beta opt-in status to ${status}.`);
      // It's unlikely a logged-in user wouldn't have a user record, so 404 is appropriate here.
      return NextResponse.json({ message: 'User record not found.' }, { status: 404 }); 
    }

    console.log(`Updated appBetaOptIn status to ${status} for user ${userId}`);

    // Return the status of the updated user
    return NextResponse.json({ 
      message: 'Beta opt-in status updated successfully',
      updatedStatus: updatedUsers[0]?.appBetaOptIn 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating appBetaOptIn status:', error);
    return NextResponse.json({ error: 'Failed to update beta opt-in status' }, { status: 500 });
  }
} 