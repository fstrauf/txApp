import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookResults } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get('prediction_id');

    if (!predictionId) {
      return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 });
    }

    const [webhookResult] = await db
      .select()
      .from(webhookResults)
      .where(eq(webhookResults.prediction_id, predictionId))
      .limit(1);

    if (!webhookResult) {
      return NextResponse.json({ error: 'Webhook result not found' }, { status: 404 });
    }

    return NextResponse.json(webhookResult);
  } catch (error) {
    console.error('Error fetching webhook result:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook result' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction_id, results } = body;

    if (!prediction_id || !results) {
      return NextResponse.json({ error: 'Prediction ID and results are required' }, { status: 400 });
    }

    // Check if a webhook result with this prediction_id already exists
    const [existingResult] = await db
      .select()
      .from(webhookResults)
      .where(eq(webhookResults.prediction_id, prediction_id))
      .limit(1);

    if (existingResult) {
      return NextResponse.json({ error: 'Webhook result already exists for this prediction ID' }, { status: 409 });
    }

    const [webhookResult] = await db
      .insert(webhookResults)
      .values({
        prediction_id,
        results
      })
      .returning();

    return NextResponse.json(webhookResult);
  } catch (error) {
    console.error('Error creating webhook result:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key value')) {
      return NextResponse.json({ error: 'A webhook result with this prediction ID already exists.' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create webhook result' }, { status: 500 });
  }
} 