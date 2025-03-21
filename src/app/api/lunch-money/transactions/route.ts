import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// This function fetches transactions from the Lunch Money API
async function fetchLunchMoneyTransactions(apiKey: string, startDate: string, endDate: string) {
  try {
    const url = `https://dev.lunchmoney.app/v1/transactions?start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch transactions from Lunch Money');
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions from Lunch Money:', error);
    throw error;
  }
}

// Function to format transactions for our application
function formatTransactions(transactions: any[]) {
  // Log first transaction to see the format
  if (transactions.length > 0) {
    console.log('Sample Lunch Money transaction:', JSON.stringify(transactions[0], null, 2));
  }
  
  return transactions.map(tx => {
    // Extract category information from Lunch Money
    // Lunch Money provides category_name and category_id directly on the transaction object
    const lunchMoneyCategory = tx.category_name || null;
    
    return {
      lunchMoneyId: tx.id.toString(),
      date: tx.date,
      description: tx.payee || tx.original_name || '',
      amount: parseFloat(tx.amount),
      type: Number(tx.amount) < 0 ? 'expense' : 'income',
      lunchMoneyCategory: lunchMoneyCategory,
      notes: tx.notes || '',
      originalData: tx
    };
  });
}

// GET handler to fetch transactions from Lunch Money
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user?.lunchMoneyApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not found' }, { status: 400 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // If specific transaction IDs are provided, fetch those from the database
    if (searchParams.has('ids')) {
      const ids = searchParams.get('ids')!.split(',');
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          lunchMoneyId: { in: ids }
        },
        include: {
          category: {
            select: { id: true, name: true }
          }
        }
      });
      
      return NextResponse.json({ transactions });
    }
    
    // Otherwise fetch transactions from Lunch Money API
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    
    const lunchMoneyTransactions = await fetchLunchMoneyTransactions(user.lunchMoneyApiKey, startDate, endDate);
    
    // Log a sample transaction structure to debug
    if (lunchMoneyTransactions.length > 0) {
      const sampleTx = lunchMoneyTransactions[0];
      console.log('FULL SAMPLE TX:', JSON.stringify({
        id: sampleTx.id,
        date: sampleTx.date,
        payee: sampleTx.payee,
        amount: sampleTx.amount,
        category: sampleTx.category,
        category_id: sampleTx.category_id
      }, null, 2));
    }
    
    const formattedTransactions = formatTransactions(lunchMoneyTransactions);
    
    // Check if any of these transactions are already in our database
    const lunchMoneyIds = formattedTransactions.map(tx => tx.lunchMoneyId);
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        lunchMoneyId: { in: lunchMoneyIds }
      },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });
    
    // Create a map of existing transactions for quick lookup
    const existingTransactionMap = new Map();
    existingTransactions.forEach(tx => {
      existingTransactionMap.set(tx.lunchMoneyId, tx);
    });
    
    // Merge the transactions with data from our database if available
    const mergedTransactions = formattedTransactions.map(tx => {
      const existingTx = existingTransactionMap.get(tx.lunchMoneyId);
      if (existingTx) {
        return {
          ...tx,
          id: existingTx.id,
          category: existingTx.category,
          isTrainingData: existingTx.isTrainingData
        };
      }
      return tx;
    });
    
    return NextResponse.json({ transactions: mergedTransactions });
  } catch (error) {
    console.error('Error in GET /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching transactions' },
      { status: 500 }
    );
  }
}

// POST handler to import transactions to our database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { transactions } = await request.json();
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No valid transactions provided' }, { status: 400 });
    }
    
    // Get or create a default bank account for this user
    let bankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: user.id,
        name: 'Lunch Money'
      }
    });
    
    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          name: 'Lunch Money',
          type: 'Checking',
          userId: user.id
        }
      });
    }
    
    // Batch upsert transactions
    const results = await Promise.all(
      transactions.map(tx => 
        prisma.transaction.upsert({
          where: {
            userId_lunchMoneyId: {
              userId: user.id,
              lunchMoneyId: tx.lunchMoneyId
            }
          },
          update: {
            description: tx.description,
            amount: tx.amount,
            date: new Date(tx.date),
            type: tx.type,
            notes: tx.notes || '',
            lunchMoneyCategory: tx.lunchMoneyCategory || null,
            bankAccountId: bankAccount!.id
          },
          create: {
            userId: user.id,
            lunchMoneyId: tx.lunchMoneyId,
            description: tx.description,
            amount: tx.amount,
            date: new Date(tx.date),
            type: tx.type,
            notes: tx.notes || '',
            lunchMoneyCategory: tx.lunchMoneyCategory || null,
            bankAccountId: bankAccount!.id
          }
        })
      )
    );
    
    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Error in POST /api/lunch-money/transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while importing transactions' },
      { status: 500 }
    );
  }
} 