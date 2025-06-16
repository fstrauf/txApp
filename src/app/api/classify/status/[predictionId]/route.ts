import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db'; // Import database instance
import { users } from '@/db/schema'; // Import users table schema
import { eq } from 'drizzle-orm'; // Import eq operator

const EXTERNAL_STATUS_URL_TEMPLATE = process.env.EXPENSE_SORTED_API + '/status/{predictionId}';

// Define a type for the parameters - REMOVED as we parse from URL
// interface RouteParams {
//   predictionId: string;
// }

export async function GET(
  request: NextRequest
  // Remove destructured params: { params }: { params: RouteParams }
) {
  // Parse predictionId from URL path
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');
  const predictionId = segments.pop() || segments.pop(); // Handle potential trailing slash

  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID is required in URL path' }, { status: 400 });
  }

  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let userApiKey: string | null = null;

  try {
    // Fetch API key from database (same as train endpoint)
    const user = await db.query.users.findFirst({
      columns: {
        api_key: true,
      },
      where: eq(users.id, userId),
    });

    if (!user) {
      console.error(`User data not found in DB for session user ID: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.api_key) {
      console.warn(`User ${userId} does not have an API key configured in the database.`);
      return NextResponse.json({ error: 'API key not configured for this user.' }, { status: 400 });
    }

    userApiKey = user.api_key;

  } catch (dbError) {
    console.error(`Database error fetching API key for user ${userId}:`, dbError);
    return NextResponse.json({ error: 'Failed to retrieve user data' }, { status: 500 });
  }

  // Construct the external URL
  const externalUrl = EXTERNAL_STATUS_URL_TEMPLATE.replace('{predictionId}', predictionId);

  console.log(`Proxying status check for user ${userId}, prediction ${predictionId} to ${externalUrl}`);

  try {
    const externalResponse = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': userApiKey, // Use key from database
        'Accept': 'application/json',
      },
      // Add cache control to prevent Next.js from caching the status response aggressively
      cache: 'no-store',
    });

    // Check Content-Type before attempting to parse JSON
    const contentType = externalResponse.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      // Only parse as JSON if the content type is correct
      responseData = await externalResponse.json();
    } else {
      // If not JSON, read as text and log the unexpected response
      const textResponse = await externalResponse.text();
      console.error(
        `External status service for ${predictionId} returned non-JSON response (Content-Type: ${contentType}):\n${textResponse.substring(0, 500)}...` // Log first 500 chars
      );
      // Return a specific error structure to the frontend
      return NextResponse.json(
        {
          status: 'error',
          error: 'Invalid response from backend status check.',
          details: `Received non-JSON response (Content-Type: ${contentType})`,
        },
        { status: 502 } // Bad Gateway - indicates invalid response from upstream server
      );
    }

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
     // Handle JSON parsing errors specifically (though the check above should prevent most)
     if (error instanceof SyntaxError) {
        return NextResponse.json(
            {
              status: 'error',
              error: 'Failed to parse backend response.',
              details: error.message,
            },
            { status: 502 } 
          );
     }
    return NextResponse.json({ error: 'Internal Server Error during status proxy' }, { status: 500 });
  }
} 