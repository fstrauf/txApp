import { NextRequest, NextResponse } from 'next/server';
import { financialAdvisorService } from '@/app/personal-finance/ai/financial-advisor-service';
import { FinancialAdvisorQuery } from '@/app/personal-finance/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (!body.userData) {
      return NextResponse.json(
        { error: 'Missing required userData' },
        { status: 400 }
      );
    }

    // Check if this is a health check request
    if (body.context === 'health_check') {
      const healthMetrics = await financialAdvisorService.getFinancialHealthCheck(body.userData);
      
      return NextResponse.json({
        healthCheck: healthMetrics
      });
    }

    // Regular advice request
    const query: FinancialAdvisorQuery = {
      userData: body.userData,
      question: body.question || undefined,
      context: body.context || undefined
    };

    // Get AI-powered financial advice
    const advice = await financialAdvisorService.getPersonalizedAdvice(query);

    return NextResponse.json(advice);
  } catch (error) {
    console.error('Financial advisor API error:', error);
    
    // Return a more generic error to the client
    return NextResponse.json(
      { error: 'Failed to generate financial advice' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Financial Advisor API - Use POST to get advice' },
    { status: 200 }
  );
}
