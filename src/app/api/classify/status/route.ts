import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users, trainingJobs, classificationJobs, transactions, categories } from '@/db/schema';
import { ClassifyServiceClient } from '@/lib/classify-service';
import { eq, and } from 'drizzle-orm';
import { createId } from '@/db/utils';

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
    
    // Find user directly using Drizzle
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    
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
      const result = await db
        .select()
        .from(trainingJobs)
        .where(
          and(
            eq(trainingJobs.id, jobId),
            eq(trainingJobs.userId, user.id)
          )
        )
        .limit(1);
      job = result[0];
    } else {
      const result = await db
        .select()
        .from(classificationJobs)
        .where(
          and(
            eq(classificationJobs.id, jobId),
            eq(classificationJobs.userId, user.id)
          )
        )
        .limit(1);
      job = result[0];
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
          await db
            .update(trainingJobs)
            .set({
              status: updatedStatus,
              completedAt: updatedStatus === 'completed' ? new Date() : null,
              error: predictionStatus.error,
            })
            .where(eq(trainingJobs.id, job.id));
        } else {
          await db
            .update(classificationJobs)
            .set({
              status: updatedStatus,
              completedAt: updatedStatus === 'completed' ? new Date() : null,
              error: predictionStatus.error,
            })
            .where(eq(classificationJobs.id, job.id));
          
          // If the job is completed and has results, update the transactions
          if (updatedStatus === 'completed' && predictionStatus.results) {
            // Get transactions for this job
            const jobTransactions = await db
              .select()
              .from(transactions)
              .where(eq(transactions.classificationJobId, job.id));
            
            // Update each transaction with its predicted category
            for (const transaction of jobTransactions) {
              // Find the matching result by description
              const matchingResult = predictionStatus.results.find(
                result => result.narrative === transaction.description
              );
              
              if (matchingResult) {
                // Find or create the category
                const categoryResult = await db
                  .select()
                  .from(categories)
                  .where(
                    and(
                      eq(categories.name, matchingResult.predicted_category),
                      eq(categories.userId, user.id)
                    )
                  )
                  .limit(1);
                
                let category = categoryResult[0];
                
                if (!category) {
                  const newCategoryResult = await db
                    .insert(categories)
                    .values({
                      id: createId(),
                      name: matchingResult.predicted_category,
                      userId: user.id,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      isDefault: false,
                    })
                    .returning();
                  
                  category = newCategoryResult[0];
                }
                
                // Update the transaction
                await db
                  .update(transactions)
                  .set({
                    categoryId: category.id,
                    predictedCategory: matchingResult.predicted_category,
                    similarityScore: matchingResult.similarity_score.toString(),
                  })
                  .where(eq(transactions.id, transaction.id));
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