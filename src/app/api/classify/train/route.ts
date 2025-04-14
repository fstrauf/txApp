import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const EXTERNAL_TRAIN_URL = 'https://txclassify.onrender.com/train';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Get the user's *correct* API key (api_key)
    const userResult = await db
      .select({ apiKey: users.api_key })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userApiKey = userResult[0]?.apiKey;

    if (!userApiKey) {
      // Use the hardcoded key as a fallback *only if intended for testing/demo*
      // Or return an error if a real key is always required
      // userApiKey = 'test_api_key_fixed';
      console.warn(`User ${userId} does not have an API key configured.`);
      return NextResponse.json({ error: 'API key not configured for this user.' }, { status: 400 });
    }

    // 2. Get the payload from the incoming request
    const payload = await request.json();

    // 3. Call the external training service with the user's API key
    console.log(`Proxying training request for user ${userId} to ${EXTERNAL_TRAIN_URL}`);
    const externalResponse = await fetch(EXTERNAL_TRAIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': userApiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 4. Forward the response (or error) back to the client
    const responseData = await externalResponse.json();

    if (!externalResponse.ok) {
       console.error(`External training service error for user ${userId}:`, externalResponse.status, responseData);
       // Forward the status code and error message from the external service
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log(`External training service success for user ${userId}:`, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error in /api/classify/train proxy for user ${userId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error during training proxy' }, { status: 500 });
  }
} 