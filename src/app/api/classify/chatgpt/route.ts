import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import OpenAI from 'openai';
import { db } from '@/db'; // Import database instance
import { users } from '@/db/schema'; // Import users table schema
import { eq } from 'drizzle-orm'; // Correct import path
import { decryptApiKey } from '@/lib/encryption'; // Import decrypt function

// Ensure OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}
if (!process.env.LUNCH_MONEY_API_URL) {
  console.warn('Missing LUNCH_MONEY_API_URL environment variable, using default.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LUNCH_MONEY_BASE_URL = process.env.LUNCH_MONEY_API_URL || 'https://dev.lunchmoney.app/v1';

// --- Helper Function to Fetch from Lunch Money API ---
async function fetchFromLunchMoneyAPI(apiKey: string, endpoint: string, params: URLSearchParams = new URLSearchParams()) {
  const url = `${LUNCH_MONEY_BASE_URL}/${endpoint}?${params.toString()}`;
  console.log(`Fetching from Lunch Money: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Lunch Money API Error (${response.status}) for ${endpoint}:`, errorData);
      throw new Error(`Lunch Money API Error (${response.status}): ${errorData.message || errorData.error || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Lunch Money endpoint ${endpoint}:`, error);
    throw error; // Re-throw to be handled by the main try/catch
  }
}

// --- Main API Route Handler ---
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  let apiKey: string;

  try {
    // 1. --- Get and Decrypt Lunch Money API Key ---
    const userResult = await db
      .select({ lunchMoneyApiKey: users.lunchMoneyApiKey })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const encryptedApiKey = userResult[0]?.lunchMoneyApiKey;

    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not configured.' }, { status: 400 });
    }

    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (decError) {
      console.error('Failed to decrypt API key for user:', userId, decError);
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 });
    }

    // 2. --- Get Transactions to Categorize from Request Body ---
    const body = await request.json();
    const transactionsToCategorize: { lunchMoneyId: string; description: string; money_in?: boolean; amount: number }[] = body.transactionsToCategorize;

    if (!Array.isArray(transactionsToCategorize) || transactionsToCategorize.length === 0) {
      return NextResponse.json({ message: 'No transactions provided to categorize.' }, { status: 400 });
    }
    console.log(`Received ${transactionsToCategorize.length} transactions from request to categorize.`);

    // 3. --- Fetch Recent Transactions (Last 60 Days) for Examples ---
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60); // Fetch last 60 days for examples
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const transactionParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      // status: 'cleared', // REMOVED - Fetch ALL statuses
      debit_as_negative: 'true'
    });
    const recentTxData = await fetchFromLunchMoneyAPI(apiKey, 'transactions', transactionParams);
    const recentTransactions = recentTxData.transactions || [];
    console.log(`Fetched ${recentTransactions.length} recent transactions (last 60 days) for examples.`);

    // 4. --- Fetch Categories ---
    const categoriesData = await fetchFromLunchMoneyAPI(apiKey, 'categories');
    const categories = (categoriesData.categories || []).map((cat: any) => ({ 
      id: cat.id, 
      name: cat.name, 
      is_income: cat.is_income 
    }));
    // Format categories for the prompt (Name (ID)) to provide both
    const categoryListString = categories.map((c: any) => `"${c.name}" (ID: ${c.id})`).join(', ');
    console.log(`Fetched ${categories.length} categories.`);

    // 5. --- Construct the Prompt for OpenAI ---
    const maxExamples = 20; // Increase max examples slightly if desired
    const examplesString = recentTransactions
      .slice(0, maxExamples)
      .map((tx: any) => {
        const categoryInfo = tx.category_name ? `"${tx.category_name}"` : 'Needs Review';
        return `- Payee: "${tx.payee || tx.original_name}", Amount: ${tx.amount}, Notes: "${tx.notes || 'N/A'}" -> Category: ${categoryInfo}`;
      })
      .join('\n');

    const transactionsString = transactionsToCategorize
      .map((tx, index) => `${index + 1}. ID: ${tx.lunchMoneyId}, Payee/Description: "${tx.description}", Amount: ${tx.amount}, Is Income: ${!!tx.money_in}`)
      .join('\n');

    const systemPrompt = `You are an expert bank transaction categorizer. Your task is to assign a category NAME to EACH of the ${transactionsToCategorize.length} transactions listed in the user message.
Your available categories are: ${categoryListString}.
If a transaction is clearly income, use an appropriate income category NAME if available (${categories.filter((c: any) => c.is_income).map((c: any) => `"${c.name}"`).join(', ')}).
If you cannot determine a suitable category from the list, use the exact string "Needs Review".
Use the provided recent transactions as examples of categorization:
${examplesString || '(No recent transaction examples available)'}

Your response MUST be a single, valid JSON array. This array MUST contain exactly ${transactionsToCategorize.length} objects.
Each object in the array MUST have ONLY two keys: "transactionId" (string) and "suggestedCategory" (string - the category NAME or "Needs Review").
Do not add any text before or after the JSON array. Do not use markdown.
Example of the required exact output format: [{"transactionId": "123", "suggestedCategory": "Groceries"}, {"transactionId": "456", "suggestedCategory": "Needs Review"}, ...]`;

    const userPrompt = `Categorize the following ${transactionsToCategorize.length} transactions using the available category NAMES or "Needs Review". Return a JSON array with ${transactionsToCategorize.length} objects, one for each transaction:
${transactionsString}`; // Simplified user prompt

    console.log("----- System Prompt -----");
    console.log(systemPrompt);
    console.log("----- User Prompt -----");
    console.log(userPrompt);
    console.log("-----------------------");

    // 6. --- Call OpenAI API ---
    console.log("Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo-1106", // Cheaper, good for testing
      // model: "o4-mini-2025-04-16", // More capable model
      model: "gpt-4o", // Switch back to a more robust model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // response_format: { type: "json_object" }, // REMOVED - Let the model return text containing JSON
      // temperature: 0.2, // Temperature requires non-JSON mode if used
    });

    const result = response.choices[0]?.message?.content;
    console.log("OpenAI Response Raw:", result);

    if (!result) {
      throw new Error('OpenAI returned an empty response.');
    }

    // 7. --- Parse and Format Response ---
    let categorizedResults;
    try {
      // *** Updated parsing to extract JSON array from text ***
      if (!result) {
        throw new Error('OpenAI returned an empty response content.');
      }
      console.log("Attempting to extract JSON array from raw text response...");
      const jsonMatch = result.match(/\[\s*\{.*\}\s*\]/s); // Regex to find [...] array
      
      if (!jsonMatch || !jsonMatch[0]) {
        console.error("Could not find JSON array pattern in response:", result);
        throw new Error('Could not extract valid JSON array from AI response.');
      }
      
      const jsonString = jsonMatch[0];
      console.log("Extracted JSON string:", jsonString);
      
      // Parse the extracted string
      const parsedJson = JSON.parse(jsonString); 
      
      // No longer need the complex checks for single objects etc., just check if it's an array
      if (!Array.isArray(parsedJson)) {
         throw new Error('Extracted JSON is not an array.');
      }
      
      categorizedResults = parsedJson;
      
      // The response *should* be a JSON string containing the array directly because of json_object mode
      // const parsedJson = JSON.parse(result);
      // Sometimes the model might still wrap it, e.g. { "results": [...] }
      // *** Updated parsing to check for "response" key ***
      // let potentialResults = parsedJson.response || parsedJson.results || parsedJson.categorizedResults || parsedJson;
      // 
      // // *** Add Robustness Check: Handle single object response ***
      // if (!Array.isArray(potentialResults) && typeof potentialResults === 'object' && potentialResults !== null && potentialResults.transactionId && potentialResults.suggestedCategory) {
      //   console.warn("OpenAI returned a single object, wrapping it in an array.");
      //   categorizedResults = [potentialResults];
      // } else if (Array.isArray(potentialResults)) {
      //   categorizedResults = potentialResults;
      // } else {
      //   // If it's neither a valid single object nor an array
      //   throw new Error('Parsed JSON from OpenAI is not an array or a valid single result object.');
      // }
      // 
      // if (!Array.isArray(categorizedResults)) {
      //   // This check might be redundant now, but kept for safety
      //   throw new Error('Processed result is not an array.');
      // }
      // Validate basic structure
      if (categorizedResults.length > 0 && (categorizedResults[0].transactionId === undefined || categorizedResults[0].suggestedCategory === undefined)) {
         throw new Error('Parsed array items lack required keys (transactionId, suggestedCategory).');
      }
      console.log(`Parsed ${categorizedResults.length} results from OpenAI.`);

    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON response:", parseError);
      console.error("Raw response was:", result);
      throw new Error('Failed to parse response from AI. The response was not valid JSON.');
    }


    // 8. --- Return the Results ---
    // Ensure the key matches what the frontend expects: { categorizedResults: [...] }
    return NextResponse.json({ categorizedResults: categorizedResults }, { status: 200 });

  } catch (error) {
    console.error('Error during ChatGPT classification route:', error);
    // Return specific error messages if possible
    if (error instanceof OpenAI.APIError) {
         return NextResponse.json({ error: `OpenAI API Error: ${error.message}` }, { status: error.status || 500 });
    } else if (error instanceof Error) {
         // Check if it's a Lunch Money API error we threw earlier
         if (error.message.startsWith('Lunch Money API Error')) {
            return NextResponse.json({ error: error.message }, { status: 400 }); // Or 502 Bad Gateway?
         }
         return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    // Fallback generic error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 