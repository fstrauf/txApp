import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is loaded
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
    console.log('OpenAI API Key status:', { hasApiKey, apiKeyLength });
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { headers, sampleRows } = await request.json();

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { error: 'Headers array is required' },
        { status: 400 }
      );
    }

    if (!sampleRows || !Array.isArray(sampleRows) || sampleRows.length === 0) {
      return NextResponse.json(
        { error: 'Sample rows are required' },
        { status: 400 }
      );
    }

    // Convert the object-based rows back to raw arrays for AI analysis
    const rawRows: string[][] = [];
    
    // Add headers as first row (these might be actual headers or just the first data row)
    rawRows.push(headers);
    
    // Add sample rows (convert from object format back to array format)
    sampleRows.forEach((row: any) => {
      const rowArray: string[] = [];
      headers.forEach((header: string) => {
        rowArray.push(row[header] || '');
      });
      rawRows.push(rowArray);
    });

    // Format the raw rows for AI analysis
    let dataSection = 'Raw CSV Data:\n';
    rawRows.forEach((row, index) => {
      dataSection += `Row ${index + 1}: ${row.map(cell => `"${cell}"`).join(', ')}\n`;
    });

    const prompt = `You are analyzing raw CSV data from a bank/financial transaction export. Your job is to:

1. **DETECT HEADERS**: Determine if Row 1 contains column headers or actual transaction data
2. **MAP COLUMNS**: Map each column to our standardized transaction fields

${dataSection}

Available mapping options:
- date: Transaction date/timestamp
- amount: Transaction amount (positive or negative numbers)  
- description: Main transaction description/merchant name
- description2: Secondary description field (optional, for additional details)
- currency: Currency code (USD, EUR, NZD, etc.)
- direction: Transaction direction/type (IN/OUT, DEBIT/CREDIT, +/-, etc.)
- balance: Account balance after transaction
- none: Don't map this column

**DATE FORMAT DETECTION:**
- Analyze the date column and determine its format.
- Choose from one of these exact format strings:
  - 'yyyy-MM-dd HH:mm:ss'
  - 'yyyy-MM-dd'
  - 'MM/dd/yyyy'
  - 'dd/MM/yyyy'
  - 'dd.MM.yyyy'
  - 'yyyy/MM/dd'
- If a date is ambiguous (e.g., 01/02/2024), assume 'dd/MM/yyyy' format.

**HEADER DETECTION RULES:**
- If Row 1 contains descriptive labels like "Date", "Amount", "Description", "Balance" → HAS HEADERS
- If Row 1 contains actual transaction data (dates like "29/06/2025", amounts like "-31.18", merchant names) → NO HEADERS
- Compare Row 1 with other rows - if Row 1 looks completely different, it's likely headers

**MAPPING RULES:**

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

For AMOUNT:
- Look for amount columns, but exclude fees and interest labeled columns

For BALANCE:
- Look for running balance columns (usually increasing/decreasing totals that change between rows)

**ANALYSIS EXAMPLE:**
- If you see Row 1: "29/06/2025", "-31.18", "StepPay Repayment", "+958.69"
- And Row 2: "29/06/2025", "-2.00", "StepPay Repayment", "+989.87"
- This suggests NO HEADERS (Row 1 is actual transaction data)
- Column mappings: 0=date, 1=amount, 2=description, 3=balance
- dateFormat would be 'dd/MM/yyyy'

Respond with a JSON object:
{
  "hasHeaders": boolean,
  "confidence": number (0-100),
  "reasoning": "explanation of your analysis",
  "dateFormat": "detected_date_format_string",
  "suggestions": {
    "ACTUAL_HEADER_VALUE_1": "mapping_option",
    "ACTUAL_HEADER_VALUE_2": "mapping_option"
  }
}

CRITICAL: Always use the EXACT header values as keys in suggestions.
For this data, use: "${headers[0]}", "${headers[1]}", "${headers[2]}", "${headers[3]}" as the keys.
Do NOT use generic names like "column1", "column2" - use the actual values from Row 1.`;

    console.log('AI analyzing CSV data with', rawRows.length, 'rows');

    const completion = await openai.chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: [
        {
          role: 'system',
          content: 'You are a conservative financial data mapping assistant. Analyze the CSV data carefully and provide accurate header detection and column mappings.'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const analysis = JSON.parse(cleanResponse);

    // Fix AI response if it used generic column names instead of actual header values
    if (analysis.suggestions) {
      const suggestionKeys = Object.keys(analysis.suggestions);
      const hasGenericKeys = suggestionKeys.some(key => 
        key.toLowerCase().includes('column') || 
        key.match(/^[0-9]+$/) ||
        !headers.includes(key)
      );
      
      if (hasGenericKeys) {
        console.log('Converting generic column names to actual header values');
        const correctedSuggestions: Record<string, string> = {};
        
        suggestionKeys.forEach((key, index) => {
          const actualHeader = headers[index];
          if (actualHeader) {
            correctedSuggestions[actualHeader] = analysis.suggestions[key];
          }
        });
        
        analysis.suggestions = correctedSuggestions;
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error getting mapping suggestions:', error);
    
    // Enhanced error logging for OpenAI issues
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    
    // Check if it's an OpenAI quota error and provide a meaningful fallback
    if (error instanceof Error && error.message.includes('quota')) {
      return NextResponse.json(
        { 
          error: 'AI service quota exceeded. Please try again later or use manual mapping.',
          fallback: true,
          details: error.message
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get mapping suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 