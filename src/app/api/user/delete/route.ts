import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/authUtils';
import type { JwtPayload } from '@/lib/authUtils';

export const runtime = 'edge';
export const preferredRegion = 'fra1';

async function handler(request: NextRequest, payload: JwtPayload) {
  if (request.method !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = payload.id;

    if (!userId) {
      // This case should ideally be caught by withAuth, but as a safeguard:
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the user from the database
    const result = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully', userId: result[0].id });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during user deletion');
    console.error('User deletion error:', error.message);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// Export the handler wrapped with authentication
export const DELETE = withAuth(handler); 