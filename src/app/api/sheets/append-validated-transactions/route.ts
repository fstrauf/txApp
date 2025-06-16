import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { google } from 'googleapis';
import { 
  EXPENSE_DETAIL_SCHEMA, 
  ExpenseDetailTransaction,
  transactionsToExpenseDetailRows 
} from '@/lib/sheets/expense-detail-schema';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions, spreadsheetId } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions data' }, { status: 400 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    // Get OAuth credentials from Authorization header or session
    const authHeader = request.headers.get('authorization');
    let accessToken: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '');
      console.log('✅ Using access token from Authorization header');
    } else {
      // Fallback to session token (for backward compatibility)
      accessToken = (session as any).accessToken || (session as any).user?.accessToken;
      console.log('📋 Using access token from session');
    }
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // Convert transactions to Expense-Detail sheet format using centralized schema
    const rows = transactionsToExpenseDetailRows(transactions as ExpenseDetailTransaction[]);

    console.log('Appending transactions to Expense-Detail sheet:', {
      spreadsheetId,
      targetSheet: EXPENSE_DETAIL_SCHEMA.sheetName,
      transactionCount: transactions.length,
      sampleRows: rows.slice(0, 2),
      expectedFormat: EXPENSE_DETAIL_SCHEMA.headers
    });

    // Append to the Expense-Detail sheet using centralized schema
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: EXPENSE_DETAIL_SCHEMA.ranges.writeData,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });

    console.log('Append response:', {
      updatedRows: response.data.updates?.updatedRows,
      updatedRange: response.data.updates?.updatedRange
    });

    return NextResponse.json({
      success: true,
      appendedCount: transactions.length,
      targetSheet: EXPENSE_DETAIL_SCHEMA.sheetName,
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows,
      message: `Successfully appended ${transactions.length} transactions to ${EXPENSE_DETAIL_SCHEMA.sheetName} sheet`
    });

  } catch (error: any) {
    console.error('Error appending transactions to spreadsheet:', error);
    
    // Handle specific Google Sheets API errors
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Permission denied. Please ensure the spreadsheet is shared with your account.',
        details: error.message
      }, { status: 403 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ 
        error: 'Spreadsheet not found. Please check the spreadsheet ID.',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to append transactions',
      details: error.toString()
    }, { status: 500 });
  }
} 