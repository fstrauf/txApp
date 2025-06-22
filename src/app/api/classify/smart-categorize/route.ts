import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { google } from 'googleapis';

interface Transaction {
  description: string;
  amount: number;
  money_in: boolean;
  date?: string;
}

interface TrainingData {
  description: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions, spreadsheetId, useCustomTraining = true } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions data' }, { status: 400 });
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'At least one transaction is required' }, { status: 400 });
    }

    // Validate transaction structure
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx.description || typeof tx.description !== 'string') {
        return NextResponse.json({ 
          error: `Transaction ${i + 1}: Invalid or missing description` 
        }, { status: 400 });
      }
    }

    let categorizedTransactions;

    if (useCustomTraining && spreadsheetId) {
      // Enhanced flow: Train on existing data, then categorize
      categorizedTransactions = await smartCategorizeWithTraining(transactions, spreadsheetId, session);
    } else {
      // Fallback to generic categorization
      categorizedTransactions = await genericCategorize(transactions);
    }

    return NextResponse.json({
      results: categorizedTransactions,
      method: useCustomTraining && spreadsheetId ? 'custom_trained' : 'generic',
      total: categorizedTransactions.length
    });

  } catch (error: any) {
    console.error('Smart categorization error:', error);
    return NextResponse.json({ 
      error: error.message || 'Categorization failed',
      details: error.toString()
    }, { status: 500 });
  }
}

async function smartCategorizeWithTraining(
  newTransactions: Transaction[], 
  spreadsheetId: string, 
  session: any
): Promise<any[]> {
  try {
    // Step 1: Read existing categorized transactions from spreadsheet
    const existingTransactions = await readExistingTransactions(spreadsheetId, session);
    
    if (existingTransactions.length === 0) {
      console.log('No existing transactions found, falling back to generic categorization');
      return await genericCategorize(newTransactions);
    }

    console.log(`Found ${existingTransactions.length} existing transactions for training`);

    // Step 2: Train custom model
    const trainingData = existingTransactions.map(t => ({
      description: t.description,
      category: t.category
    }));

    await trainCustomModel(trainingData);

    // Step 3: Categorize new transactions with custom model
    const categorizedTransactions = await categorizeWithCustomModel(newTransactions);

    return categorizedTransactions;

  } catch (error) {
    console.error('Smart categorization failed, falling back to generic:', error);
    return await genericCategorize(newTransactions);
  }
}

async function readExistingTransactions(spreadsheetId: string, session: any): Promise<any[]> {
  try {
    // Get OAuth credentials from session
    const accessToken = session.accessToken || session.user.accessToken;
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read data from the spreadsheet (assuming standard format)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:G', // Date, Description, Amount, Category, Type, Account, Confidence
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return []; // No data or just headers

    // Parse rows into transaction objects
    const transactions = rows.slice(1) // Skip headers
      .filter(row => row.length >= 4 && row[3]) // Must have category
      .map(row => ({
        date: row[0] || '',
        description: row[1] || '',
        amount: parseFloat(row[2]) || 0,
        category: row[3] || '',
        type: row[4] || '',
        account: row[5] || '',
        confidence: row[6] || ''
      }))
      .filter(t => t.description && t.category && t.category !== 'Uncategorized');

    return transactions;

  } catch (error: any) {
    console.error('Error reading existing transactions:', error);
    throw new Error(`Failed to read spreadsheet: ${error.message}`);
  }
}

async function trainCustomModel(trainingData: TrainingData[]): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/classify/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        training_data: trainingData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Training failed');
    }

    console.log('Custom model trained successfully');
  } catch (error: any) {
    console.error('Training error:', error);
    throw new Error(`Model training failed: ${error.message}`);
  }
}

async function categorizeWithCustomModel(transactions: Transaction[]): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/classify/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: transactions
      }),
      // Add timeout for better reliability
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Categorization failed');
    }

    const result = await response.json();
    return result.results || [];

  } catch (error: any) {
    console.error('Custom categorization error:', error);
    
    // Better error handling for timeouts
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Classification request timed out. Please try again with fewer transactions.');
    }
    
    throw new Error(`Custom categorization failed: ${error.message}`);
  }
}

async function genericCategorize(transactions: Transaction[]): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transactions/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: transactions
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Generic categorization failed');
    }

    const result = await response.json();
    return result.results || [];

  } catch (error: any) {
    console.error('Generic categorization error:', error);
    throw new Error(`Generic categorization failed: ${error.message}`);
  }
} 