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

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title || `Personal Finance Tracker - ${new Date().toLocaleDateString()}`
        },
        sheets: [{
          properties: {
            title: 'Expense-Detail',
            gridProperties: {
              frozenRowCount: 1 // Freeze header row
            }
          }
        }]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;

    // Prepare the data for Expense-Detail format
    const headers = ['Source', 'Date', 'Narrative', 'Amount Spent', 'Category', 'Currency Spent', 'Amount in Base Currency: AUD', ''];
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const rows = [
      headers,
      ...sortedTransactions.map((t: Transaction) => [
        'ExpenseSorted Import', // Source (A)
        t.date, // Date (B)
        t.description, // Narrative (C)
        Math.abs(t.amount), // Amount Spent (D) - always positive
        t.category, // Category (E)
        'AUD', // Currency Spent (F)
        Math.abs(t.amount), // Amount in Base Currency: AUD (G)
        '' // Column H (empty)
      ])
    ];

    // Add the data to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expense-Detail!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows
      }
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Make header row bold
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
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
                sheetId: sheetId,
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
                sheetId: sheetId,
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
                sheetId: sheetId,
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

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      transactionCount: transactions.length,
      message: `Successfully created Google Sheet with ${transactions.length} transactions`
    });

  } catch (error: any) {
    console.error('Create spreadsheet error:', error);
    
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

    return NextResponse.json(
      { error: error.message || 'Failed to create Google Sheet' },
      { status: 500 }
    );
  }
} 