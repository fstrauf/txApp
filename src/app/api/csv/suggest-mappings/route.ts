import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleRows } = await request.json();

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { error: 'Headers array is required' },
        { status: 400 }
      );
    }

    // Build sample data section for the prompt
    let sampleDataSection = '';
    if (sampleRows && Array.isArray(sampleRows) && sampleRows.length > 0) {
      console.log(`Using ${sampleRows.length} sample rows for AI analysis`);
      sampleDataSection = `\n\nSample Data (${sampleRows.length} rows):\n`;
      sampleRows.forEach((row, index) => {
        sampleDataSection += `Row ${index + 1}:\n`;
        headers.forEach(header => {
          const value = row[header];
          const displayValue = value === null || value === undefined ? '[empty]' : String(value).slice(0, 50); // Limit length
          sampleDataSection += `  ${header}: "${displayValue}"\n`;
        });
        sampleDataSection += '\n';
      });
    } else {
      console.log('No sample data provided, using headers only');
    }

    const prompt = `You are helping to map CSV headers from a bank/financial transaction export to our standardized fields.

CSV Headers: ${headers.join(', ')}${sampleDataSection}

Available mapping options:
- date: Transaction date/timestamp
- amount: Transaction amount (positive or negative numbers)
- description: Main transaction description/merchant name
- description2: Secondary description field (optional, for additional details)
- currency: Currency code (USD, EUR, NZD, etc.)
- direction: Transaction direction/type (IN/OUT, DEBIT/CREDIT, +/-, etc.)
- none: Don't map this column

CRITICAL ANALYSIS STEPS:
1. Look at the ACTUAL DATA VALUES in the sample rows, not just the header names
2. Identify which field contains the MERCHANT NAME or TRANSACTION RECIPIENT
3. Card numbers (****-****-****) are NOT descriptions - they're just payment methods

SPECIFIC EXAMPLES FROM YOUR DATA:
- If you see "Code" contains values like "Woolworths N", "Mountain War", "H&M" → These are MERCHANT NAMES → map to "description"
- If you see "Details" contains values like "4835-****-****-0311" → These are CARD NUMBERS → NOT a description
- If you see "Type" contains values like "Visa Purchase", "Automatic Payment" → These indicate transaction type → map to "direction"

FIELD MAPPING RULES:

For DESCRIPTION (most important - the merchant/recipient name):
- IGNORE fields that contain:
  * Card numbers (****-****-****)
  * Account numbers
  * Generic payment method info
- LOOK FOR fields that contain:
  * Store names (Woolworths, H&M)
  * Business names (Moore Rentals, Mountain War)
  * Service providers (Majestic Tea)
- Common field names that contain merchant info:
  * "Code" in ANZ exports
  * "Target name" in Wise exports
  * "Merchant" or "Payee" in other formats

For DESCRIPTION2 (secondary info):
- Only use if it adds meaningful context
- Could be transaction category, reference, or additional details
- Do NOT use for card numbers or payment methods

For DIRECTION:
- Transaction types count as direction (e.g., "Visa Purchase" = outgoing)
- Don't require explicit IN/OUT values

ANALYZE THE SAMPLE DATA:
Looking at your samples, which field contains the actual merchant names?
- Type: "Visa Purchase" → This is transaction type
- Details: "4835-****-****-0311" → This is a card number
- Code: "Woolworths N", "H&M", "Mountain War" → These are MERCHANT NAMES!

Based on this analysis, provide the correct mappings.

Respond with a JSON object where keys are the exact CSV headers and values are the mapping suggestions:

{
  "header1": "mapping_option",
  "header2": "mapping_option"
}`;

    console.log('AI Prompt length:', prompt.length);
    console.log('Sample of prompt:', prompt.slice(0, 500) + '...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a conservative financial data mapping assistant. Only suggest mappings when you are highly confident. When in doubt, use "none".'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.05, // Lower temperature for more conservative suggestions
      max_tokens: 1500,
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