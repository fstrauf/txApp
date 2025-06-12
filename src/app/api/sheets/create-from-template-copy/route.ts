import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { 
  ExpenseDetailTransaction,
  transactionsToExpenseDetailRows 
} from '@/lib/sheets/expense-detail-schema';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  category: string;
  account: string;
  isDebit: boolean;
}

const TEMPLATE_SPREADSHEET_ID = process.env.TEMPLATE_SPREADSHEET_ID;

export async function POST(request: NextRequest) {
  try {
    if (!TEMPLATE_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'Template spreadsheet ID not configured in environment' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { transactions, title, baseCurrency }: { 
      transactions: Transaction[]; 
      title: string;
      baseCurrency?: string;
    } = await request.json();

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
    console.log('🔄 Attempting to copy template spreadsheet:', {
      templateId: TEMPLATE_SPREADSHEET_ID,
      title: title || `Personal Finance Tracker - ${new Date().toLocaleDateString()}`,
      accessToken: accessToken ? 'Present' : 'Missing'
    });

    // First, verify the template exists and is accessible
    try {
      const templateInfo = await drive.files.get({
        fileId: TEMPLATE_SPREADSHEET_ID,
        fields: 'id,name,permissions'
      });
      console.log('✅ Template spreadsheet accessible:', templateInfo.data.name);
    } catch (templateError: any) {
      console.error('❌ Template not accessible:', templateError);
      throw new Error(`Template spreadsheet not accessible: ${templateError.message}`);
    }

    const copiedFile = await drive.files.copy({
      fileId: TEMPLATE_SPREADSHEET_ID,
      requestBody: {
        name: title || `Personal Finance Tracker - ${new Date().toLocaleDateString()}`,
        parents: undefined // This will place it in the user's root Drive folder
      },
      supportsAllDrives: true // This helps with shared drives
    });

    console.log('✅ Successfully copied template file:', copiedFile.data);

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

    // Convert transactions to proper format for centralized schema
    const defaultBaseCurrency = baseCurrency || 'USD'; // Default to USD if not provided
    const expenseDetailTransactions: ExpenseDetailTransaction[] = sortedTransactions.map((t: Transaction) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      originalAmount: t.originalAmount || t.amount,
      originalCurrency: t.originalCurrency || defaultBaseCurrency,
      baseCurrency: defaultBaseCurrency,
      category: t.category,
      account: t.account,
      isDebit: t.isDebit,
      confidence: 1.0
    }));

    // Use centralized schema function to ensure consistent amount handling
    const transactionRows = transactionsToExpenseDetailRows(expenseDetailTransactions);

    // Add transactions to the Expense-Detail sheet starting from row 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: transactionRows
      }
    });

    // Set up headers with dynamic base currency
    const headers = ['Source', 'Date', 'Narrative', 'Amount Spent', 'Category', 'Currency Spent', `Amount in Base Currency: ${defaultBaseCurrency}`, ''];
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

    // Write base currency to Config sheet (cell B2)
    try {
      // Check if Config sheet exists
      const configSheet = spreadsheetInfo.data.sheets?.find(
        sheet => sheet.properties?.title === 'Config'
      );
      
      if (configSheet) {
        console.log('📝 Writing base currency to Config sheet...');
        await sheets.spreadsheets.values.update({
          spreadsheetId: newSpreadsheetId,
          range: 'Config!B2',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[defaultBaseCurrency]]
          }
        });
        console.log(`✅ Base currency ${defaultBaseCurrency} written to Config sheet`);
      } else {
        console.log('⚠️ Config sheet not found in template, skipping base currency setup');
      }
    } catch (configError: any) {
      console.error('❌ Error writing to Config sheet:', configError);
      // Don't fail the entire operation if Config write fails
    }

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
    console.error('❌ Copy template error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      status: error.status,
      message: error.message,
      response: error.response?.data,
      config: error.config ? 'Present' : 'Missing'
    });
    
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

    // More specific error messages
    if (error.message?.includes('Request failed with status code')) {
      return NextResponse.json(
        { error: `Google API error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create copy from template: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 