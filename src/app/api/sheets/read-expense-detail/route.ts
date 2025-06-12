import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { 
  EXPENSE_DETAIL_SCHEMA, 
  ExpenseDetailTransaction,
  parseExpenseDetailRows,
  validateExpenseDetailHeaders,
  filterRecentTransactions,
  sortTransactionsByDate
} from '@/lib/sheets/expense-detail-schema';



export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { spreadsheetId, baseCurrency }: { spreadsheetId: string; baseCurrency?: string } = await request.json();

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID required' },
        { status: 400 }
      );
    }

    // Create OAuth2 client with the provided token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // First, check if the Expense-Detail sheet exists
    let spreadsheetInfo;
    try {
      spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId
      });
    } catch (error: any) {
      if (error.code === 404) {
        return NextResponse.json(
          { error: 'Spreadsheet not found or not accessible. Make sure the spreadsheet is shared or you have access.' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Find the "Expense-Detail" sheet
    const expenseDetailSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === 'Expense-Detail'
    );

    if (!expenseDetailSheet) {
      const availableSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title).join(', ') || 'none';
      return NextResponse.json(
        { 
          error: 'Expense-Detail sheet not found in this spreadsheet. This feature requires the ExpenseSorted template format.',
          availableSheets
        },
        { status: 400 }
      );
    }

    // Read all data from the Expense-Detail sheet using centralized schema
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: EXPENSE_DETAIL_SCHEMA.ranges.readAll,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json(
        { error: 'No data found in Expense-Detail sheet' },
        { status: 400 }
      );
    }

    // Validate headers using centralized schema
    const headers = rows[0];
    const headerValidation = validateExpenseDetailHeaders(headers);
    
    if (!headerValidation.isValid) {
      return NextResponse.json(
        { 
          error: `Invalid sheet format: ${headerValidation.errors.join(', ')}`,
          foundHeaders: headers,
          expectedHeaders: EXPENSE_DETAIL_SCHEMA.headers
        },
        { status: 400 }
      );
    }

    console.log('Headers validated:', headers);
    console.log('Raw data rows count:', rows.length - 1);

    // Parse rows using centralized schema with dynamic base currency
    const defaultBaseCurrency = baseCurrency || 'USD';
    const allTransactions = parseExpenseDetailRows(rows, spreadsheetId, defaultBaseCurrency);
    console.log('Parsed transactions:', allTransactions.length);

    // Filter to last 12 months (according to memory)
    const recentTransactions = filterRecentTransactions(allTransactions, 12);
    console.log('Recent transactions (last 12 months):', recentTransactions.length);

    // Sort by date (newest first)
    const transactions = sortTransactionsByDate(recentTransactions);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found in the last 12 months. Please check your data format.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions,
      transactionCount: transactions.length,
      spreadsheetId,
      sheetName: 'Expense-Detail',
      message: `Successfully imported ${transactions.length} transactions from the last 12 months (Expense-Detail sheet)`
    });

  } catch (error: any) {
    console.error('Read Google Sheet error:', error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired Google access token' },
        { status: 401 }
      );
    }
    
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Please grant access to Google Sheets.' },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Spreadsheet not found or not accessible' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to read Google Sheet' },
      { status: 500 }
    );
  }
} 