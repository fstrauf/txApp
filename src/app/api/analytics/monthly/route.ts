import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { addMonths, subMonths } from 'date-fns';
import { getMonthlyFinancialData, aggregateMonthlyData, recalculateMonthlyAggregates } from '@/lib/analytics-service';
import { db } from '@/db';
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
    
    // Get monthly data with user ID
    const monthlyData = await getMonthlyFinancialData(user.id, startDate, endDate);
    
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
    
    // Handle different actions
    if (action === 'generateMonth' && month) {
      // Generate data for a specific month
      const targetMonth = new Date(month);
      const result = await aggregateMonthlyData(user.id, targetMonth);
      return NextResponse.json({ success: true, data: result });
    } 
    else if (action === 'recalculate' && startDate && endDate) {
      // Recalculate a date range
      const result = await recalculateMonthlyAggregates(
        user.id, 
        new Date(startDate), 
        new Date(endDate)
      );
      return NextResponse.json({ success: true, data: result });
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