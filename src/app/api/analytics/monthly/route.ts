import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { subMonths } from 'date-fns';
import { getMonthlyFinancialData, aggregateMonthlyData, recalculateMonthlyAggregates } from '@/lib/analytics-service';
import { findUserByEmail } from '@/db/utils';

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    // Default to last 12 months if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : subMonths(endDate, 11);

    // Get user from session email
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`Getting monthly data for user ID: ${user.id}`);
    
    // Get monthly data with user ID
    const monthlyData = await getMonthlyFinancialData(user.id as string, startDate, endDate);
    
    console.log(`Found ${monthlyData.length} monthly records`);
    
    // Log a sample record with category expenses
    if (monthlyData.length > 0) {
      const sampleRecord = monthlyData[0];
      console.log(`Sample record: month=${sampleRecord.month}, income=${sampleRecord.income}, expenses=${sampleRecord.expenses}`);
      console.log(`Category expenses count: ${sampleRecord.categoryExpenses?.length || 0}`);
    }
    
    return NextResponse.json({ monthlyData });
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, month, startDate, endDate } = body;
    
    // Get user from session email
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`Processing ${action} action for user ID: ${user.id}`);
    
    // Handle different actions
    if (action === 'generateMonth' && month) {
      // Generate data for a specific month
      const targetMonth = new Date(month);
      console.log(`Generating monthly data for ${targetMonth.toISOString().slice(0, 10)}`);
      
      // Check for Lunch Money API key before proceeding
      console.log(`User has Lunch Money API key: ${!!user.lunchMoneyApiKey}`);
      
      try {
        const result = await aggregateMonthlyData(user.id as string, targetMonth);
        console.log(`Generated monthly data with success`);
        return NextResponse.json({ success: true, data: result });
      } catch (error) {
        console.error('Error in aggregateMonthlyData:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to generate monthly data' },
          { status: 500 }
        );
      }
    } 
    else if (action === 'recalculate' && startDate && endDate) {
      // Recalculate a date range
      console.log(`Recalculating from ${startDate} to ${endDate}`);
      
      try {
        const result = await recalculateMonthlyAggregates(
          user.id as string, 
          new Date(startDate), 
          new Date(endDate)
        );
        
        console.log(`Recalculated ${result.monthsProcessed} months`);
        return NextResponse.json({ success: true, data: result });
      } catch (error) {
        console.error('Error in recalculateMonthlyAggregates:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to recalculate monthly data' },
          { status: 500 }
        );
      }
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing analytics action:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics action' },
      { status: 500 }
    );
  }
} 