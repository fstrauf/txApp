import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

const TXCLASSIFY_API_URL = process.env.TXCLASSIFY_API_URL || 'http://localhost:80';
const TXCLASSIFY_API_KEY = process.env.TXCLASSIFY_API_KEY || 'test-api-key-123';

interface TransactionInput {
  description?: string;
  Description?: string;
  amount?: number;
  Amount_Spent?: string | number;
  category?: string;
  Category?: string;
  date?: string;
  Date?: string;
  Source?: string;
  money_in?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get session to ensure user is authenticated
    const session = await getServerSession(authConfig);
    
    // For testing purposes, allow bypass with test header
    const testMode = request.headers.get('x-test-mode') === 'true';
    
    if (!testMode && !session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { transactions, analysis_types, excluded_categories } = await request.json();

    // Validate input
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Transactions array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Transform transactions to the format expected by txClassify
    const transformedTransactions = transactions.map((tx: any) => {
      const transformed: TransactionInput = {};
      
      // Handle different column name formats
      if (tx.description) transformed.description = tx.description;
      if (tx.Description) transformed.Description = tx.Description;
      
      if (tx.amount !== undefined) transformed.amount = tx.amount;
      if (tx.Amount_Spent !== undefined) transformed.Amount_Spent = tx.Amount_Spent;
      if (tx['Amount Spent'] !== undefined) transformed.Amount_Spent = tx['Amount Spent'];
      
      if (tx.category) transformed.category = tx.category;
      if (tx.Category) transformed.Category = tx.Category;
      
      if (tx.date) transformed.date = tx.date;
      if (tx.Date) transformed.Date = tx.Date;
      
      if (tx.Source) transformed.Source = tx.Source;
      if (tx.money_in !== undefined) transformed.money_in = tx.money_in;
      if (tx.isDebit !== undefined) transformed.money_in = !tx.isDebit;
      
      // Set money_in based on transaction type if available
      if (tx.type) {
        transformed.money_in = tx.type === 'income';
      }
      
      // Ensure negative amounts for expenses if amount is positive but type is expense
      if (tx.type === 'expense' && transformed.amount && transformed.amount > 0) {
        transformed.amount = -Math.abs(transformed.amount);
      }
      
      // Ensure positive amounts for income if amount is negative but type is income  
      if (tx.type === 'income' && transformed.amount && transformed.amount < 0) {
        transformed.amount = Math.abs(transformed.amount);
      }

      return transformed;
    });

    console.log(`🔍 Sending ${transformedTransactions.length} transactions to analytics service`);
    console.log(`📊 Sample transaction:`, transformedTransactions[0]);
    console.log(`💰 Amount distribution:`, {
      positive: transformedTransactions.filter(tx => (tx.amount || 0) > 0).length,
      negative: transformedTransactions.filter(tx => (tx.amount || 0) < 0).length,
      zero: transformedTransactions.filter(tx => (tx.amount || 0) === 0).length
    });

    // Call txClassify financial analytics service
    const response = await fetch(`${TXCLASSIFY_API_URL}/financial-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TXCLASSIFY_API_KEY,
      },
      body: JSON.stringify({
        transactions: transformedTransactions,
        analysis_types: analysis_types || [
          'vendor_intelligence',
          'anomaly_detection', 
          'subscription_analysis',
          'savings_opportunities',
          'cash_flow_prediction'
        ],
        excluded_categories: excluded_categories || []
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ txClassify API error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          error: `Analytics service error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const analyticsResult = await response.json();
    
    console.log(`✅ Analytics completed for user ${testMode ? 'test-user' : session?.user?.id}`);
    console.log(`📈 Found ${analyticsResult.categories_found?.all_categories?.length || 0} categories`);

    // Add user context to the result
    const result = {
      ...analyticsResult,
      user_id: testMode ? 'test-user' : session?.user?.id,
      processed_at: new Date().toISOString(),
      service_url: TXCLASSIFY_API_URL
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Financial analytics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process financial analytics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check if txClassify service is available
    const healthResponse = await fetch(`${TXCLASSIFY_API_URL}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': TXCLASSIFY_API_KEY,
      },
    });

    const isHealthy = healthResponse.ok;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      txclassify_url: TXCLASSIFY_API_URL,
      txclassify_status: healthResponse.status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      txclassify_url: TXCLASSIFY_API_URL,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 