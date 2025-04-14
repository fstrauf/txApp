import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const EXTERNAL_CLASSIFY_URL = 'https://txclassify.onrender.com/classify';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Get the user's API key
    const userResult = await db
      .select({ apiKey: users.api_key })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userApiKey = userResult[0]?.apiKey;

    if (!userApiKey) {
      console.warn(`User ${userId} does not have an API key configured.`);
      return NextResponse.json({ error: 'API key not configured for this user.' }, { status: 400 });
    }

    // 2. Get the payload from the incoming request
    const payload = await request.json();

    // 3. Call the external classification service with the user's API key
    console.log(`Proxying classification request for user ${userId} to ${EXTERNAL_CLASSIFY_URL}`);
    const externalResponse = await fetch(EXTERNAL_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': userApiKey, // Use the fetched user-specific key
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 4. Forward the response (or error) back to the client
    const responseData = await externalResponse.json();

    if (!externalResponse.ok) {
       console.error(`External classification service error for user ${userId}:`, externalResponse.status, responseData);
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log(`External classification service success for user ${userId}:`, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error in /api/classify/classify proxy for user ${userId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error during classification proxy' }, { status: 500 });
  }
} 