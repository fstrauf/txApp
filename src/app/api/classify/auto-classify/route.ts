import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_AUTO_CLASSIFY_URL = process.env.EXPENSE_SORTED_API + '/auto-classify';
const DEFAULT_API_KEY = process.env.EXPENSE_SORTED_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Use the default API key for auto-classification (no authentication required)
    if (!DEFAULT_API_KEY) {
      console.error('EXPENSE_SORTED_DEFAULT_API_KEY environment variable is not configured.');
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    console.log('Processing auto-classification request with default API key');
    
    // Get the payload from the incoming request
    const payload = await request.json();

    // Call the external auto-classification service with the default API key
    console.log(`Proxying auto-classification request to ${EXTERNAL_AUTO_CLASSIFY_URL}`);
    const externalResponse = await fetch(EXTERNAL_AUTO_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEFAULT_API_KEY, // Use the default API key for public access
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Forward the response (or error) back to the client
    const responseData = await externalResponse.json();

    if (!externalResponse.ok) {
       console.error('External auto-classification service error:', externalResponse.status, responseData);
       return NextResponse.json(responseData, { status: externalResponse.status });
    }

    console.log('External auto-classification service success:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in /api/classify/auto-classify proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error during auto-classification proxy' }, { status: 500 });
  }
} 