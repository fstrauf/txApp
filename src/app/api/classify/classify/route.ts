import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateClassifyRequest, handleClassifyError } from '@/lib/classify-validation';

const EXTERNAL_CLASSIFY_URL = process.env.EXPENSE_SORTED_API + '/classify';

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

    console.log(`User ${userId} API key ${userApiKey} found, proceeding with classification.`);
    
    // 2. Get and validate the payload from the incoming request
    const rawPayload = await request.json();
    
    // Validate and format the request data
    const validatedPayload = validateClassifyRequest(rawPayload);
    
    console.log(`Validated ${validatedPayload.transactions.length} transactions for user ${userId}`);

    // 3. Call the external classification service with the user's API key
    console.log(`Proxying classification request for user ${userId} to ${EXTERNAL_CLASSIFY_URL}`);
    const externalResponse = await fetch(EXTERNAL_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': userApiKey, // Use the fetched user-specific key
        'Accept': 'application/json',
      },
      body: JSON.stringify(validatedPayload),
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
    
    // Handle validation errors with user-friendly messages
    if (error instanceof Error && error.message.includes('Request validation failed')) {
      const errorInfo = handleClassifyError(error);
      return NextResponse.json({ 
        error: errorInfo.message,
        details: errorInfo.details 
      }, { status: errorInfo.status });
    }
    
    // Handle specific column mapping errors
    if (error instanceof Error && (
      error.message.includes('column mapping') ||
      error.message.includes('CSV header') ||
      error.message.includes('same value') ||
      error.message.includes('appears to be a') ||
      error.message.includes('duplicate mapping')
    )) {
      return NextResponse.json({ 
        error: 'Column Mapping Error: Please check your CSV column mapping. It appears that description columns may be mapped to amount fields, or header data is being processed as transaction data.',
        details: error.message,
        solution: 'Please go back to your CSV upload and verify that:\n1. Amount columns are mapped to numeric fields only\n2. Description columns are mapped to text fields only\n3. The same column is not mapped to multiple fields\n4. Your CSV file does not contain header rows mixed with data'
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal Server Error during classification proxy' }, { status: 500 });
  }
} 