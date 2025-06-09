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

// Extract spreadsheet ID from various Google Sheets URL formats
function extractSpreadsheetId(url: string): string | null {
  const patterns = [
    // Standard edit URL
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    // Direct ID (if user just pastes the ID)
    /^([a-zA-Z0-9-_]{44})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
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
    const { spreadsheetUrl, transactions }: { spreadsheetUrl: string; transactions: Transaction[] } = await request.json();

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: 'Spreadsheet URL is required' },
        { status: 400 }
      );
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Valid transactions array required' },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL. Please provide a valid spreadsheet URL.' },
        { status: 400 }
      );
    }

    // Create OAuth2 client with the provided token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // Try to access the spreadsheet to validate it exists and we have permission
    let spreadsheetInfo;
    try {
      spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      });
    } catch (error: any) {
      if (error.code === 404) {
        return NextResponse.json(
          { error: 'Spreadsheet not found. Please check the URL and ensure it\'s accessible.' },
          { status: 404 }
        );
      }
      if (error.code === 403) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure the spreadsheet is shared with you or publicly accessible.' },
          { status: 403 }
        );
      }
      throw error;
    }

    // Find the first sheet (we'll append to the first sheet)
    const firstSheet = spreadsheetInfo.data.sheets?.[0];
    if (!firstSheet?.properties?.title) {
      return NextResponse.json(
        { error: 'No sheets found in the spreadsheet' },
        { status: 400 }
      );
    }

    const sheetName = firstSheet.properties.title;

    // Get existing data to find the next empty row
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z` // Get all columns to detect existing structure
    });

    const existingRows = existingData.data.values || [];
    const nextRow = existingRows.length + 1;

    // Check if the sheet has headers, and if not, add them
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Type', 'Account'];
    let needsHeaders = false;
    
    if (existingRows.length === 0) {
      needsHeaders = true;
    } else {
      // Check if first row looks like headers
      const firstRow = existingRows[0];
      const hasDateHeader = firstRow.some((cell: any) => 
        String(cell).toLowerCase().includes('date')
      );
      const hasAmountHeader = firstRow.some((cell: any) => 
        String(cell).toLowerCase().includes('amount')
      );
      
      if (!hasDateHeader && !hasAmountHeader) {
        needsHeaders = true;
      }
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Prepare the data to append
    const dataToAppend = sortedTransactions.map((t: Transaction) => [
      t.date,
      t.description,
      t.isDebit ? -Math.abs(t.amount) : Math.abs(t.amount), // Negative for expenses, positive for income
      t.category,
      t.isDebit ? 'Expense' : 'Income',
      t.account || 'Imported'
    ]);

    // If we need headers, add them first
    if (needsHeaders) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers]
        }
      });

      // Format the header row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: firstSheet.properties.sheetId,
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
            }
          ]
        }
      });
    }

    // Append the transaction data
    const appendRange = needsHeaders ? `${sheetName}!A2` : `${sheetName}!A${nextRow}`;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: appendRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: dataToAppend
      }
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      sheetName,
      transactionCount: transactions.length,
      addedHeaders: needsHeaders,
      message: `Successfully added ${transactions.length} transactions to ${sheetName}`
    });

  } catch (error: any) {
    console.error('Append to spreadsheet error:', error);
    
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
        { error: 'Spreadsheet not found. Please check the URL.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to append transactions to Google Sheet' },
      { status: 500 }
    );
  }
} 