import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users, categories, transactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type TrainingData = {
  lunchMoneyId: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  categoryId: string;
  categoryName: string;
  notes?: string;
  originalData?: any;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email!))
      .limit(1);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { trainingData } = await request.json();
    
    if (!Array.isArray(trainingData) || trainingData.length === 0) {
      return NextResponse.json({ error: 'No valid training data provided' }, { status: 400 });
    }
    
    // Validate the training data
    for (const item of trainingData) {
      if (!item.lunchMoneyId || !item.description || !item.categoryId) {
        return NextResponse.json({ 
          error: 'Invalid training data. Each item must have lunchMoneyId, description, and categoryId' 
        }, { status: 400 });
      }
      
      // Verify that the category exists and belongs to the user
      const categoryResult = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, item.categoryId),
            eq(categories.userId, user.id)
          )
        )
        .limit(1);
      
      const category = categoryResult[0];
      
      if (!category) {
        return NextResponse.json({ 
          error: `Category with ID ${item.categoryId} not found or does not belong to the user` 
        }, { status: 400 });
      }
    }
    
    // Process the training data
    const results = await Promise.all(
      trainingData.map(async (item: TrainingData) => {
        const transactionResult = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, user.id),
              eq(transactions.lunchMoneyId, item.lunchMoneyId)
            )
          )
          .limit(1);
        
        const transaction = transactionResult[0];
        
        if (!transaction) {
          return null;
        }
        
        // Update the transaction with the assigned category and mark as training data
        const updatedResult = await db
          .update(transactions)
          .set({
            categoryId: item.categoryId,
            isTrainingData: true
          })
          .where(eq(transactions.id, transaction.id))
          .returning();
        
        return updatedResult[0];
      })
    );
    
    // Filter out nulls (transactions that weren't found)
    const updatedTransactions = results.filter(Boolean);
    
    // If user has a classify API key, send the training data to the classify service
    if (user.classifyApiKey) {
      try {
        // Format data for the classification service
        const formattedData = trainingData
          .filter(item => {
            // Find the corresponding transaction that was updated
            const transaction = updatedTransactions.find(tx => 
              tx && tx.lunchMoneyId === item.lunchMoneyId
            );
            return !!transaction;
          })
          .map((item: TrainingData) => ({
            text: item.description,
            amount: item.amount,
            date: item.date,
            type: item.type,
            notes: item.notes || '',
            category: item.categoryId
          }));
        
        if (formattedData.length > 0) {
          // Send data to the classification service
          const response = await fetch('https://api.classify.service/train', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.classifyApiKey}`
            },
            body: JSON.stringify({
              userId: user.id,
              trainingData: formattedData
            })
          });
          
          if (!response.ok) {
            console.error('Error training classification service:', await response.text());
          }
        }
      } catch (error) {
        console.error('Error calling classification service:', error);
        // We don't want to fail the entire request if the classification service fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      count: updatedTransactions.length, 
      message: `Successfully trained with ${updatedTransactions.length} transactions` 
    });
    
  } catch (error) {
    console.error('Error in POST /api/classify/train:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while training the model' },
      { status: 500 }
    );
  }
} 