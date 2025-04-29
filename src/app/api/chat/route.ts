import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/index.mjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db'; // Import the central db instance
import * as schema from '@/db/schema'; // Import your drizzle schema

// Ensure environment variables are set
// DATABASE_URL is used implicitly by the central db instance
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Remove local Pool and Drizzle initialization - use central db
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const db = drizzle(pool, { schema });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the structure of your transactions table (adjust as needed)
// Provide a simplified view for the AI, focusing on queryable columns
const tableSchema = `
Table name: transactions
Relevant Columns for querying (MUST use double quotes around column names in SQL, e.g., \"categoryId\"):
  id: TEXT (Primary Key)
  date: TIMESTAMPTZ
  description: TEXT
  amount: NUMERIC
  type: ENUM('credit', 'debit')
  bankAccountId: TEXT (References bankAccounts table)
  categoryId: TEXT (References categories table, contains the category ID)
  userId: TEXT (References users table)
  isReconciled: BOOLEAN
  notes: TEXT
  createdAt: TIMESTAMPTZ
  updatedAt: TIMESTAMPTZ
  isTrainingData: BOOLEAN
  lunchMoneyCategory: TEXT (Category name imported from Lunch Money, might be relevant)
  predictedCategory: TEXT (AI predicted category)
`;

// Define the OpenAI function schema for executing SQL
const executeSqlFunctionTool: ChatCompletionTool = {
  type: 'function' as const,
  function: {
    name: 'executeQuery',
    description: `Executes a read-only SQL query against the 'transactions' table using raw SQL. Only SELECT queries are allowed. IMPORTANT: Always enclose column names in double quotes around column names in SQL, e.g., \"categoryId\". Schema: ${tableSchema}`,
    parameters: {
      type: 'object' as const,
      properties: {
        sql: {
          type: 'string',
          description: `The raw SQL SELECT query string to execute. IMPORTANT: Always use double quotes around column names (e.g., \"userId\", \"amount\"). Example: SELECT \"categoryId\", SUM(\"amount\") FROM transactions WHERE \"type\" = 'expense' GROUP BY \"categoryId\";`,
        },
      },
      required: ['sql'],
    },
  }
};

// Fetch user categories (name and ID) using the central Drizzle db instance
async function getUserCategoryContext(userId: string): Promise<{ id: string; name: string; }[]> {
  if (!userId) {
    console.error("[API] Cannot fetch categories: User ID is missing.");
    return []; 
  }

  try {
    console.log(`[API] Fetching categories (name and ID) for user: ${userId} using Drizzle...`);
    
    // Fetch distinct category names and IDs for the specific user
    const results = await db.selectDistinct({ name: schema.categories.name, id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId)) 
      .orderBy(schema.categories.name)
      .limit(100); 
    
    console.log("[API] Fetched categories (name and ID):", results);
    // Return the array of objects containing id and name
    return results;

  } catch (error) {
    console.error("[API] Error fetching category context:", error);
    return []; 
  }
}


// Helper function to safely execute AI-generated raw SQL
async function safeExecuteSql(sqlString: string): Promise<any> {
  const cleanedSql = sqlString.trim();
  const upperCaseSql = cleanedSql.toUpperCase();

  // Allow SELECT or WITH at the start, but still require FROM TRANSACTIONS somewhere
  const startsWithSelect = upperCaseSql.startsWith('SELECT');
  const startsWithWith = upperCaseSql.startsWith('WITH');
  const includesFromTransactions = upperCaseSql.includes('FROM TRANSACTIONS');

  if (!(startsWithSelect || startsWithWith) || !includesFromTransactions) {
      console.error("Blocked potentially unsafe SQL:", cleanedSql);
      throw new Error("Query validation failed. Query must start with SELECT or WITH and reference the transactions table.");
  }

  try {
    console.log("Executing AI SQL:", cleanedSql); 
    // Use Drizzle's general sql execution method directly with the raw string
    const results = await db.execute(cleanedSql);
    const rows = (results as any).rows || results; // Adapt as needed
    console.log("SQL Result Rows:", Array.isArray(rows) ? rows.length : 'N/A');
    const MAX_ROWS = 50;
    return Array.isArray(rows) ? rows.slice(0, MAX_ROWS) : rows; 
  } catch (error) {
    console.error("SQL Execution Error:", error);
    if (error instanceof Error) {
        throw new Error(`Database error: ${error.message.split('\n')[0]}`); 
    }
    throw new Error("An unknown database error occurred.");
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract message AND userId from the request body
    const { message, userId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ error: 'User ID is missing or invalid' }, { status: 400 });
    }

    console.log(`[API] Received message: "${message}" for user: ${userId}`);

    // --- Fetch Context --- 
    // Fetch category context (name and ID)
    const userCategories = await getUserCategoryContext(userId);
    const categoryListText = userCategories.length > 0 
      ? `Here is a list of the user's categories (Name [ID]): ${userCategories.map(c => `${c.name} [${c.id}]`).join(', ')}.` 
      : 'Could not retrieve user category list.';
    
    // Get current date for context
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dateContextText = `For context, the current date is ${currentDate}. Assume queries relate to the current year (${currentDate.substring(0, 4)}) unless the user specifies a different year or date range.`;

    // --- Construct System Prompt --- 
    const messages: ChatCompletionMessageParam[] = [
       {
        role: "system",
        content: `You are an AI assistant called Auto Accountant. You help users understand financial transactions by querying the 'transactions' table.
        ${dateContextText} 
        ${tableSchema}
        ${categoryListText}
        IMPORTANT:
        1. The 'amount' column stores debit transactions (expenses) as NEGATIVE numbers (e.g., -50.00) and credit transactions (income) as POSITIVE numbers. This means finding the 'biggest' or 'highest' expenses requires sorting amount in ASCENDING (ASC) order.
        2. Use the provided category list (with names and IDs) to understand user queries. If a user asks about a category like 'groceries', find the corresponding category ID from the list (e.g., 'Groceries [cat_abc123]' means the ID is 'cat_abc123').
        3. When generating SQL for the 'executeQuery' function, you MUST use the category ID in the WHERE clause (e.g., WHERE "categoryId" = 'cat_abc123'). Do NOT filter using the category name directly on the transactions table unless joining.
        4. Always enclose all column names in double quotes (e.g., SELECT "description", "amount" FROM transactions WHERE "categoryId" = 'some_id').
        Based on the user's request, decide if querying the database is necessary. Respond directly otherwise.
        5. Unless otherwise specified, Transfer Categories should be ignored in aggregation queries.`
      },
      { role: "user", content: message },
    ];

    // --- OpenAI interaction --- 
    let response = await openai.chat.completions.create({ model: "o4-mini-2025-04-16", messages: messages, tools: [executeSqlFunctionTool], tool_choice: "auto" });
    let responseMessage = response.choices[0].message;

    // --- Function Call Handling (uses safeExecuteSql) --- 
    if (responseMessage.tool_calls?.length) {
      console.log('[API] OpenAI requested function call:', responseMessage.tool_calls);
      messages.push(responseMessage); 
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'executeQuery') {
        const args = JSON.parse(toolCall.function.arguments);
        // ** Ensure the argument is actually named 'sql' as defined in the tool **
        const sqlToExecute = args.sql;
        if (typeof sqlToExecute !== 'string') {
          throw new Error("Invalid or missing 'sql' argument from AI.");
        }

        try {
          const queryResult = await safeExecuteSql(sqlToExecute);
          messages.push({ tool_call_id: toolCall.id, role: "tool", content: JSON.stringify(queryResult) });
          console.log("[API] Sending SQL results back to OpenAI");
          response = await openai.chat.completions.create({ model: "o4-mini-2025-04-16", messages: messages, tools: [executeSqlFunctionTool], tool_choice: "auto" });
          responseMessage = response.choices[0].message;
        } catch (error: any) {
           console.error("[API] Error executing SQL or processing result:", error);
           messages.push({ tool_call_id: toolCall.id, role: "tool", content: JSON.stringify({ error: error.message }) });
           console.log("[API] Sending error back to OpenAI");
           response = await openai.chat.completions.create({ model: "o4-mini-2025-04-16", messages: messages });
           responseMessage = response.choices[0].message;
        }
      }
    }

    const finalResponseText = responseMessage.content || "Sorry, I couldn't generate a response.";
    console.log("[API] Final response to client:", finalResponseText);

    return NextResponse.json({ response: finalResponseText });

  } catch (error) {
    console.error('[API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
} 