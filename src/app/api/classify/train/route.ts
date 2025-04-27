import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db'; // Import database instance
import { users } from '@/db/schema'; // Import users table schema
import { eq } from 'drizzle-orm'; // Import eq operator

const EXTERNAL_TRAIN_URL = process.env.EXPENSE_SORTED_API + '/train';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  // 1. Authentication: Check if user is logged in
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  console.log(`Processing training request for user: ${userId}`);

  let userApiKey: string | null = null;

  try {
    // 2. Authorization/Retrieve Key: Fetch API key from database
    const user = await db.query.users.findFirst({
      columns: {
        api_key: true,
      },
      where: eq(users.id, userId),
    });

    if (!user) {
      // This shouldn't happen if the session is valid, but good to check
      console.error(`User data not found in DB for session user ID: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.api_key) {
      console.warn(`User ${userId} does not have an API key configured in the database.`);
      return NextResponse.json({ error: 'API key not configured for this user.' }, { status: 400 });
    }

    userApiKey = user.api_key; // Assign the fetched key

  } catch (dbError) {
     console.error(`Database error fetching API key for user ${userId}:`, dbError);
     return NextResponse.json({ error: 'Failed to retrieve user data' }, { status: 500 });
  }

  // 3. Get the payload from the incoming request
  let payload;
  try {
      payload = await request.json();
  } catch (parseError) {
      console.error(`Error parsing request body for user ${userId}:`, parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  // 4. Call the external training service with the API key from DB
  console.log(`Proxying training request for user ${userId} to ${EXTERNAL_TRAIN_URL}`);
  try {
    const externalResponse = await fetch(EXTERNAL_TRAIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': userApiKey, // Use key fetched from DB
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 5. Forward the response (or error) back to the client
    // Use .clone() to allow reading the body twice (once for logging, once for response)
    const responseClone = externalResponse.clone();
    const responseData = await responseClone.json().catch(() => responseClone.text()); // Read as JSON or text fallback

    if (!externalResponse.ok) {
       console.error(`External training service error for user ${userId}: Status ${externalResponse.status}`, responseData);
       // Ensure the response status from the external service is forwarded
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log(`External training service success for user ${userId}`);
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