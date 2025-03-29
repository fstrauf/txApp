import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { trainingJobs, transactions, classificationJobs } from '@/db/schema';
import { findUserByEmail, createId } from '@/db/utils';
import { ClassifyServiceClient } from '@/lib/classify-service';
import { and, eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { transactionIds, trainingJobId } = await request.json();
    
    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: 'Transaction IDs are required' },
        { status: 400 }
      );
    }
    
    if (!trainingJobId) {
      return NextResponse.json(
        { error: 'Training job ID is required' },
        { status: 400 }
      );
    }
    
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.classifyApiKey) {
      return NextResponse.json(
        { error: 'Classification API key not found' },
        { status: 400 }
      );
    }
    
    // Verify that the training job exists and belongs to the user
    const trainingJobResult = await db
      .select()
      .from(trainingJobs)
      .where(
        and(
          eq(trainingJobs.id, trainingJobId),
          eq(trainingJobs.userId, user.id),
          eq(trainingJobs.status, 'completed')
        )
      )
      .limit(1);
    
    const trainingJob = trainingJobResult[0];
    
    if (!trainingJob) {
      return NextResponse.json(
        { error: 'Training job not found or not completed' },
        { status: 400 }
      );
    }
    
    // Get the transactions to classify
    const transactionsToClassify = await db
      .select()
      .from(transactions)
      .where(
        and(
          inArray(transactions.id, transactionIds),
          eq(transactions.userId, user.id)
        )
      );
    
    if (transactionsToClassify.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found for classification' },
        { status: 400 }
      );
    }
    
    // Create a new classification job
    const [classificationJob] = await db
      .insert(classificationJobs)
      .values({
        id: createId(),
        userId: user.id,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();
    
    // Link transactions to the classification job
    await db
      .update(transactions)
      .set({
        classificationJobId: classificationJob.id,
      })
      .where(inArray(transactions.id, transactionIds));
    
    // Initialize the classification service client
    const classifyClient = new ClassifyServiceClient({
      apiKey: user.classifyApiKey,
      serviceUrl: process.env.CLASSIFY_SERVICE_URL || 'http://localhost:5001',
    });
    
    // Start the classification process
    const classificationResult = await classifyClient.classifyTransactions(
      transactionsToClassify,
      trainingJob.predictionId || trainingJobId
    );
    
    // Update the classification job with the prediction ID
    await db
      .update(classificationJobs)
      .set({
        status: classificationResult.status,
        predictionId: classificationResult.prediction_id,
        error: classificationResult.error,
      })
      .where(eq(classificationJobs.id, classificationJob.id));
    
    return NextResponse.json({
      success: classificationResult.status !== 'failed',
      jobId: classificationJob.id,
      predictionId: classificationResult.prediction_id,
      status: classificationResult.status,
      error: classificationResult.error,
    });
    
  } catch (error) {
    console.error('Error classifying transactions:', error);
    return NextResponse.json(
      { error: 'Failed to classify transactions' },
      { status: 500 }
    );
  }
} 