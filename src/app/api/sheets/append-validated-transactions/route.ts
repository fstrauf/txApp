import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { google } from 'googleapis';

interface ValidatedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
  confidence?: number;
}

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

    // Get OAuth credentials from session
    const accessToken = (session as any).accessToken || (session as any).user?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare data for Google Sheets
    // Format: Date | Description | Amount | Category | Type | Account | Confidence
    const rows = transactions.map((transaction: ValidatedTransaction) => [
      transaction.date,
      transaction.description,
      transaction.isDebit ? -Math.abs(transaction.amount) : Math.abs(transaction.amount), // Negative for expenses
      transaction.category,
      transaction.isDebit ? 'Expense' : 'Income',
      transaction.account,
      transaction.confidence ? Math.round(transaction.confidence * 100) + '%' : '100%'
    ]);

    console.log('Appending transactions to spreadsheet:', {
      spreadsheetId,
      transactionCount: transactions.length,
      sampleRows: rows.slice(0, 2)
    });

    // Append to the spreadsheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:G', // Assuming columns A-G for our data
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
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows
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