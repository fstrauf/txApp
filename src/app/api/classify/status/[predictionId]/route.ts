import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const EXTERNAL_STATUS_URL_BASE = 'https://txclassify.onrender.com/status/';

// Define the context type for route segment parameters
// type RouteContext = {
//   params: {
//     predictionId: string;
//   };
// };

// Updated function signature for correct dynamic params handling in Next.js 13+
export async function GET(
  request: NextRequest,
  { params }: { params: { predictionId: string } }
) {
  const session = await getServerSession(authConfig);
  const { predictionId } = params; // Destructure after params is fully resolved

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!predictionId) {
    return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
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

    // 2. Construct the external URL
    const externalUrl = `${EXTERNAL_STATUS_URL_BASE}${predictionId}`;

    // 3. Call the external status service with the user's API key
    console.log(`Proxying status check request for user ${userId} to ${externalUrl}`);
    const externalResponse = await fetch(externalUrl, {
      method: 'GET', // Status check is likely a GET request
      headers: {
        'X-API-Key': userApiKey, // Use the fetched user-specific key
        'Accept': 'application/json',
      },
    });

    // 4. Forward the response (or error) back to the client
    // Handle cases where the external service might not return JSON on error
    let responseData;
    try {
        responseData = await externalResponse.json();
    } catch (jsonError) {
        // If JSON parsing fails, read the response as text
        const textResponse = await externalResponse.text();
        console.error(`External status service non-JSON response for user ${userId}:`, externalResponse.status, textResponse);
        // Return the text response or a generic error
        return NextResponse.json(
            { error: `External service returned non-JSON response: ${externalResponse.status}`, details: textResponse },
            { status: externalResponse.status }
        );
    }

    // Special handling for job context missing error (which can happen even with 200 status)
    if (responseData.error?.includes('Job context missing') || responseData.status === 'error') {
      console.error(`External service reported job context missing for prediction ${predictionId}:`, responseData);
      
      // This often happens when a job completes but the context is cleaned up
      // Check if there might be results in the response despite the error
      if (responseData.results && responseData.results.length > 0) {
        console.log('Found results despite context error, returning them anyway');
        return NextResponse.json({
          status: 'completed',
          results: responseData.results,
          warning: 'Results recovered despite job context error'
        });
      }
      
      // If this is a common 500 error with job context missing, interpret as completed BUT indicate results missing
      if (responseData.code === 500 && responseData.error === 'Job context missing or invalid after prediction success') {
        console.log('Detected common "job context missing after success" error, assuming job completed but results lost.');
        // Return a specific status or error indicating results are unavailable
        return NextResponse.json({
          status: 'error', // Indicate an error state for the frontend
          error: 'Classification completed, but results could not be retrieved.',
          message: 'The prediction service cleaned up the results too quickly. Please try again or categorize manually.',
          code: 'RESULTS_UNAVAILABLE' // Custom code for frontend handling
        }, { status: 200 }); // Return 200 OK but with error details in body
      }
      
      // Otherwise return the original error
      return NextResponse.json(responseData, { status: 500 });
    }

    if (!externalResponse.ok) {
       console.error(`External status service error for user ${userId}, prediction ${predictionId}:`, externalResponse.status, responseData);
       // Forward the status code and error message from the external service
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log(`External status service success for user ${userId}, prediction ${predictionId}:`, responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error in /api/classify/status proxy for user ${userId}, prediction ${predictionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error during status proxy' }, { status: 500 });
  }
} 