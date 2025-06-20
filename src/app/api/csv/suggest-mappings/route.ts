import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { headers } = await request.json();

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { error: 'Headers array is required' },
        { status: 400 }
      );
    }

    const prompt = `You are helping to map CSV headers from a bank/financial transaction export to our standardized fields.

CSV Headers: ${headers.join(', ')}

Available mapping options:
- date: Transaction date/timestamp
- amount: Transaction amount (positive or negative numbers)
- description: Main transaction description/merchant name
- description2: Secondary description field (optional, for additional details)
- currency: Currency code (USD, EUR, NZD, etc.)
- none: Don't map this column

Please analyze these headers and suggest the best mapping for each one. Consider:
- Date fields should map to "date" (look for created, finished, transaction date, etc.)
- Amount fields should map to "amount" (after fees is usually preferred over gross amounts)
- Merchant names, target names, or descriptions should map to "description" 
- Additional details can map to "description2"
- Currency codes should map to "currency"
- IDs, statuses, directions, fees, and other metadata should map to "none"

Respond with a JSON object where keys are the exact CSV headers and values are the mapping suggestions:

{
  "header1": "mapping_option",
  "header2": "mapping_option"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response by removing markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    const suggestions = JSON.parse(cleanResponse);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error getting mapping suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get mapping suggestions' },
      { status: 500 }
    );
  }
} 