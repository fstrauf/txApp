import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

const TEMPLATE_SPREADSHEET_ID = '1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4';

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
    const { transactions, title }: { transactions: Transaction[]; title: string } = await request.json();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Valid transactions array required' },
        { status: 400 }
      );
    }

    // Create OAuth2 client with the provided token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Copy the template spreadsheet directly (no need to check accessibility first)
    // The template should be publicly accessible with "Anyone with link can view"
    const copiedFile = await drive.files.copy({
      fileId: TEMPLATE_SPREADSHEET_ID,
      requestBody: {
        name: title || `Personal Finance Tracker - ${new Date().toLocaleDateString()}`,
        parents: undefined // This will place it in the user's root Drive folder
      },
      supportsAllDrives: true // This helps with shared drives
    });

    const newSpreadsheetId = copiedFile.data.id!;

    console.log('Successfully copied template:', {
      originalId: TEMPLATE_SPREADSHEET_ID,
      copiedId: newSpreadsheetId,
      copiedName: copiedFile.data.name
    });

    // Get the sheet information to find the "new_transactions" sheet
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: newSpreadsheetId
    });

    // Find the "Expense-Detail" sheet
    const expenseDetailSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === 'Expense-Detail'
    );

    if (!expenseDetailSheet) {
      return NextResponse.json(
        { error: 'Template does not contain an "Expense-Detail" sheet' },
        { status: 400 }
      );
    }

    const sheetName = 'Expense-Detail';

    // Clear existing data in Expense-Detail (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: newSpreadsheetId,
      range: `${sheetName}!A2:H`
    });

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Prepare transaction data for the Expense-Detail sheet
    // Format: Source, Date, Narrative, Amount Spent, Category, Currency Spent, Amount in Base Currency: AUD
    const transactionRows = sortedTransactions.map((t: Transaction) => [
      'ExpenseSorted Import', // Source (A)
      t.date, // Date (B)
      t.description, // Narrative (C)
      Math.abs(t.amount), // Amount Spent (D) - always positive
      t.category, // Category (E)
      'AUD', // Currency Spent (F)
      Math.abs(t.amount), // Amount in Base Currency: AUD (G)
      '' // Column H (empty)
    ]);

    // Add transactions to the Expense-Detail sheet starting from row 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: transactionRows
      }
    });

    // Set up headers if they don't exist (in case the template doesn't have them)
    const headers = ['Source', 'Date', 'Narrative', 'Amount Spent', 'Category', 'Currency Spent', 'Amount in Base Currency: AUD', ''];
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers]
      }
    });

    // Format the Expense-Detail sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: newSpreadsheetId,
      requestBody: {
        requests: [
          // Make header row bold
          {
            repeatCell: {
              range: {
                sheetId: expenseDetailSheet.properties?.sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9
                  }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: expenseDetailSheet.properties?.sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 8
              }
            }
          },
          // Format amount columns as currency (D and G)
          {
            repeatCell: {
              range: {
                sheetId: expenseDetailSheet.properties?.sheetId,
                startRowIndex: 1,
                startColumnIndex: 3,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '"$"#,##0.00'
                  }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          },
          // Format amount in base currency column as currency (G)
          {
            repeatCell: {
              range: {
                sheetId: expenseDetailSheet.properties?.sheetId,
                startRowIndex: 1,
                startColumnIndex: 6,
                endColumnIndex: 7
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '"$"#,##0.00'
                  }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          }
        ]
      }
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

    return NextResponse.json({
      success: true,
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl,
      transactionCount: transactions.length,
      sheetName: 'Expense-Detail',
      message: `Successfully created copy of template with ${transactions.length} transactions in Expense-Detail sheet`
    });

  } catch (error: any) {
    console.error('Copy template error:', error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired Google access token' },
        { status: 401 }
      );
    }
    
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Please grant access to Google Sheets and Google Drive.' },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Template spreadsheet not found or not accessible' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create copy from template' },
      { status: 500 }
    );
  }
} 