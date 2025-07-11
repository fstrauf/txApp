import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { google, sheets_v4 } from 'googleapis';
import { 
  EXPENSE_DETAIL_SCHEMA, 
  ExpenseDetailTransaction,
  transactionsToExpenseDetailRows 
} from '@/lib/sheets/expense-detail-schema';

export async function POST(request: NextRequest) {
  let sheets: sheets_v4.Sheets | undefined;
  let rows: (string | number | null)[][] = [];
  let transactions: ExpenseDetailTransaction[] = [];
  const { spreadsheetId: initialSpreadsheetId } = await request.json();

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    transactions = body.transactions;
    let spreadsheetId = body.spreadsheetId;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions data' }, { status: 400 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let accessToken: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '');
      console.log('✅ Using access token from Authorization header');
    } else {
      accessToken = (session as any).accessToken || (session as any).user?.accessToken;
      console.log('📋 Using access token from session');
    }
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    sheets = google.sheets({ version: 'v4', auth });

    rows = transactionsToExpenseDetailRows(transactions as ExpenseDetailTransaction[]);

    console.log('Appending transactions to Expense-Detail sheet:', {
      spreadsheetId,
      targetSheet: EXPENSE_DETAIL_SCHEMA.sheetName,
      transactionCount: transactions.length,
      sampleRows: rows.slice(0, 2),
      expectedFormat: EXPENSE_DETAIL_SCHEMA.headers
    });

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

    if (error.code === 404 && sheets && rows.length > 0) {
      try {
        console.log('Spreadsheet not found. Creating a new one.');
        
        const newSpreadsheet = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title: 'My txApp Transactions' },
            sheets: [{
              properties: {
                title: EXPENSE_DETAIL_SCHEMA.sheetName,
                gridProperties: { frozenRowCount: 1 },
              },
            }],
          },
          fields: 'spreadsheetId',
        });

        const newSpreadsheetId = newSpreadsheet.data.spreadsheetId;
        if (!newSpreadsheetId) {
          throw new Error('Failed to create a new spreadsheet.');
        }

        console.log(`📝 New spreadsheet created with ID: ${newSpreadsheetId}`);
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: newSpreadsheetId,
          range: `${EXPENSE_DETAIL_SCHEMA.sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[...EXPENSE_DETAIL_SCHEMA.headers]],
          },
        });

        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: newSpreadsheetId,
          range: EXPENSE_DETAIL_SCHEMA.ranges.writeData,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: rows,
          },
        });

        return NextResponse.json({
          success: true,
          newSpreadsheetId,
          appendedCount: transactions.length,
          targetSheet: EXPENSE_DETAIL_SCHEMA.sheetName,
          updatedRange: appendResponse.data.updates?.updatedRange,
          updatedRows: appendResponse.data.updates?.updatedRows,
          message: `Successfully created new sheet and appended ${transactions.length} transactions.`,
        });

      } catch (creationError: any) {
        console.error('Error creating new spreadsheet after 404:', creationError);
        return NextResponse.json({
          error: 'Spreadsheet not found, and creating a new one failed.',
          details: creationError.message,
        }, { status: 500 });
      }
    }
    
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