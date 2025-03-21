import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClassifyServiceClient } from '@/lib/classify-service';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('job_id');
    const jobType = searchParams.get('type') || 'classification'; // Default to classification
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
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
    
    // Get the job based on type
    let job;
    if (jobType === 'training') {
      job = await prisma.trainingJob.findFirst({
        where: {
          id: jobId,
          userId: user.id,
        },
      });
    } else {
      job = await prisma.classificationJob.findFirst({
        where: {
          id: jobId,
          userId: user.id,
        },
      });
    }
    
    if (!job) {
      return NextResponse.json(
        { error: `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} job not found` },
        { status: 404 }
      );
    }
    
    // If the job is already completed or failed, return the status
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        predictionId: job.predictionId,
        error: job.error,
        completedAt: job.completedAt,
      });
    }
    
    // If the job has a prediction ID, check the status with the classification service
    if (job.predictionId) {
      // Initialize the classification service client
      const classifyClient = new ClassifyServiceClient({
        apiKey: user.classifyApiKey,
        serviceUrl: process.env.CLASSIFY_SERVICE_URL || 'http://localhost:5001',
      });
      
      // Check the prediction status
      const predictionStatus = await classifyClient.getPredictionStatus(job.predictionId);
      
      // Update the job status based on the prediction status
      let updatedStatus = job.status;
      if (predictionStatus.status === 'completed') {
        updatedStatus = 'completed';
      } else if (predictionStatus.status === 'failed') {
        updatedStatus = 'failed';
      }
      
      // Update the job in the database
      if (updatedStatus !== job.status) {
        if (jobType === 'training') {
          await prisma.trainingJob.update({
            where: { id: job.id },
            data: {
              status: updatedStatus,
              completedAt: updatedStatus === 'completed' ? new Date() : null,
              error: predictionStatus.error,
            },
          });
        } else {
          await prisma.classificationJob.update({
            where: { id: job.id },
            data: {
              status: updatedStatus,
              completedAt: updatedStatus === 'completed' ? new Date() : null,
              error: predictionStatus.error,
            },
          });
          
          // If the job is completed and has results, update the transactions
          if (updatedStatus === 'completed' && predictionStatus.results) {
            // Get transactions for this job
            const transactions = await prisma.transaction.findMany({
              where: {
                classificationJobId: job.id,
              },
            });
            
            // Update each transaction with its predicted category
            for (const transaction of transactions) {
              // Find the matching result by description
              const matchingResult = predictionStatus.results.find(
                result => result.narrative === transaction.description
              );
              
              if (matchingResult) {
                // Find or create the category
                let category = await prisma.category.findFirst({
                  where: {
                    name: matchingResult.predicted_category,
                    userId: user.id,
                  },
                });
                
                if (!category) {
                  category = await prisma.category.create({
                    data: {
                      name: matchingResult.predicted_category,
                      userId: user.id,
                    },
                  });
                }
                
                // Update the transaction
                await prisma.transaction.update({
                  where: { id: transaction.id },
                  data: {
                    categoryId: category.id,
                    predictedCategory: matchingResult.predicted_category,
                    similarityScore: matchingResult.similarity_score,
                  },
                });
              }
            }
          }
        }
      }
      
      return NextResponse.json({
        jobId: job.id,
        status: updatedStatus,
        predictionId: job.predictionId,
        predictionStatus: predictionStatus.status,
        error: predictionStatus.error,
        results: predictionStatus.results,
        message: predictionStatus.message,
      });
    }
    
    // If the job doesn't have a prediction ID, return the current status
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      error: job.error,
    });
    
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
} 