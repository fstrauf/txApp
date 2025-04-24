import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';

const EXTERNAL_TRAIN_URL = process.env.EXPENSE_SORTED_API + '/train';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  // Add type assertion for session to include apiKey
  const typedSession = session as (typeof session & { apiKey?: string });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const userApiKey = typedSession?.apiKey;

  if (!userApiKey) {
    // If key is not in session, it means it wasn't fetched/added during JWT callback
    console.warn(`User ${userId} does not have an API key configured or it's missing from session.`);
    return NextResponse.json({ error: 'API key not configured or unavailable in session.' }, { status: 400 });
  }

  // 2. Get the payload from the incoming request
  const payload = await request.json();

  // 3. Call the external training service with the API key from session
  console.log(`Proxying training request for user ${userId} to ${EXTERNAL_TRAIN_URL}`);
  try {
    const externalResponse = await fetch(EXTERNAL_TRAIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': userApiKey, // Use key from session
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 4. Forward the response (or error) back to the client
    const responseData = await externalResponse.json();

    if (!externalResponse.ok) {
       console.error(`External training service error for user ${userId}:`, externalResponse.status, responseData);
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log(`External training service success for user ${userId}:`, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error in /api/classify/train proxy for user ${userId}:`, error);
    // Check if it's a fetch error (e.g., network issue)
    if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
        return NextResponse.json({ error: 'Failed to connect to the external training service.' }, { status: 502 }); // Bad Gateway
    }
    return NextResponse.json({ error: 'Internal Server Error during training proxy' }, { status: 500 });
  }
} 