import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClassifyServiceClient } from '@/lib/classify-service';

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
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
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
    const trainingJob = await prisma.trainingJob.findFirst({
      where: {
        id: trainingJobId,
        userId: user.id,
        status: 'completed',
      },
    });
    
    if (!trainingJob) {
      return NextResponse.json(
        { error: 'Training job not found or not completed' },
        { status: 400 }
      );
    }
    
    // Get the transactions to classify
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });
    
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found for classification' },
        { status: 400 }
      );
    }
    
    // Create a new classification job
    const classificationJob = await prisma.classificationJob.create({
      data: {
        userId: user.id,
        status: 'pending',
      }
    });
    
    // Link transactions to the classification job
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
      },
      data: {
        classificationJobId: classificationJob.id,
      },
    });
    
    // Initialize the classification service client
    const classifyClient = new ClassifyServiceClient({
      apiKey: user.classifyApiKey,
      serviceUrl: process.env.CLASSIFY_SERVICE_URL || 'http://localhost:5001',
    });
    
    // Start the classification process
    const classificationResult = await classifyClient.classifyTransactions(
      transactions,
      trainingJob.predictionId || trainingJobId
    );
    
    // Update the classification job with the prediction ID
    await prisma.classificationJob.update({
      where: { id: classificationJob.id },
      data: {
        status: classificationResult.status,
        predictionId: classificationResult.prediction_id,
        error: classificationResult.error,
      },
    });
    
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