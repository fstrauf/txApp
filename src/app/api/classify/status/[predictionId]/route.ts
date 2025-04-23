import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
// Remove db imports if only used for apiKey fetch
// import { db } from '@/db';
// import { users } from '@/db/schema';
// import { eq } from 'drizzle-orm';

const EXTERNAL_STATUS_URL_TEMPLATE = 'https://txclassify.onrender.com/status/{predictionId}';

// Define a type for the parameters
interface RouteParams {
  predictionId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  // No need to await params here, Next.js provides it directly
  const { predictionId } = params;

  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
  }

  const session = await getServerSession(authConfig);

  // Add type assertion for session to include apiKey
  const typedSession = session as (typeof session & { apiKey?: string });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // *** CHANGE: Get API key from session ***
  const userApiKey = typedSession?.apiKey;

  // *** REMOVED: Database query for API key ***
  /*
  const userResult = await db
    .select({ apiKey: users.api_key })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const userApiKey = userResult[0]?.apiKey;
  */

  if (!userApiKey) {
    console.warn(`User ${userId} does not have an API key configured or it's missing from session.`);
    return NextResponse.json({ error: 'API key not configured or unavailable in session.' }, { status: 400 });
  }

  // Construct the external URL
  const externalUrl = EXTERNAL_STATUS_URL_TEMPLATE.replace('{predictionId}', predictionId);

  console.log(`Proxying status check for user ${userId}, prediction ${predictionId} to ${externalUrl}`);

  try {
    const externalResponse = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': userApiKey, // Use key from session
        'Accept': 'application/json',
      },
      // Add cache control to prevent Next.js from caching the status response aggressively
      cache: 'no-store',
    });

    // Forward the response (or error) back to the client
    const responseData = await externalResponse.json();

    if (!externalResponse.ok) {
      // Log specific external errors but forward them
      console.error(`External status service error for user ${userId}, prediction ${predictionId}:`, externalResponse.status, responseData);

      // Handle specific error cases like "Job context missing or invalid"
      if (externalResponse.status === 404 && responseData?.detail === "Job context missing or invalid") {
        // This might indicate the job wasn't found or hasn't propagated yet.
        // We already handle retries on the frontend, so just forward the 404.
        return NextResponse.json(responseData, { status: 404 });
      }
      // Forward other errors
      return NextResponse.json(responseData, { status: externalResponse.status });
    }

    // Log success and return
    console.log(`External status service success for user ${userId}, prediction ${predictionId}:`, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error in /api/classify/status proxy for user ${userId}, prediction ${predictionId}:`, error);
     // Check if it's a fetch error (e.g., network issue)
     if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
         return NextResponse.json({ error: 'Failed to connect to the external status service.' }, { status: 502 }); // Bad Gateway
     }
    return NextResponse.json({ error: 'Internal Server Error during status proxy' }, { status: 500 });
  }
} 