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

interface AllSheetsData {
  transactions?: ExpenseDetailTransaction[];
  transactionCount?: number;
  config?: {
    baseCurrency?: string;
    [key: string]: any;
  };
  savings?: {
    latestNetAssetValue: number;
    latestQuarter: string;
    formattedValue: string;
    totalEntries: number;
  };
  availableSheets: string[];
  spreadsheetId: string;
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
    const { spreadsheetId }: { spreadsheetId: string } = await request.json();

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

    // First, get spreadsheet info to see what sheets are available
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

    const availableSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title).filter((title): title is string => Boolean(title)) || [];
    const result: AllSheetsData = {
      availableSheets,
      spreadsheetId
    };

    // Read multiple sheets in parallel for efficiency
    const readPromises = [];

    // 1. Read Expense-Detail sheet if available
    if (availableSheets.includes('Expense-Detail')) {
      readPromises.push(
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: EXPENSE_DETAIL_SCHEMA.ranges.readAll,
          valueRenderOption: 'UNFORMATTED_VALUE'
        }).then(response => ({ type: 'expense-detail', data: response.data.values }))
      );
    }

    // 2. Read Config sheet if available
    if (availableSheets.includes('Config')) {
      readPromises.push(
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Config!A:C',
          valueRenderOption: 'UNFORMATTED_VALUE'
        }).then(response => ({ type: 'config', data: response.data.values }))
      );
    }

    // 3. Read Savings sheet if available
    if (availableSheets.includes('Savings')) {
      readPromises.push(
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Savings!A:Z',
          valueRenderOption: 'UNFORMATTED_VALUE'
        }).then(response => ({ type: 'savings', data: response.data.values }))
      );
    }

    // Execute all reads in parallel
    const results = await Promise.allSettled(readPromises);

    // Process results
    for (const promiseResult of results) {
      if (promiseResult.status === 'fulfilled') {
        const { type, data } = promiseResult.value;

        if (type === 'expense-detail' && data && data.length >= 2) {
          // Process Expense-Detail data
          const headers = data[0];
          const headerValidation = validateExpenseDetailHeaders(headers);
          
          if (headerValidation.isValid) {
            const allTransactions = parseExpenseDetailRows(data, spreadsheetId);
            const recentTransactions = filterRecentTransactions(allTransactions, 12);
            const transactions = sortTransactionsByDate(recentTransactions);
            
            result.transactions = transactions;
            result.transactionCount = transactions.length;
          }
        }

        if (type === 'config' && data && data.length > 0) {
          // Process Config data - look for base currency in cell B2
          if (data.length >= 2 && data[1] && data[1][1]) {
            const baseCurrencyValue = String(data[1][1]).trim();
            if (baseCurrencyValue && baseCurrencyValue.length === 3) {
              result.config = {
                baseCurrency: baseCurrencyValue.toUpperCase()
              };
            }
          }
        }

        if (type === 'savings' && data && data.length > 0) {
          // Process Savings data - find Net Asset Value column
          const headerRow = data[0];
          const netAssetValueIndex = headerRow.findIndex((header: any) => 
            header && String(header).toLowerCase().includes('net asset value')
          );

          if (netAssetValueIndex !== -1) {
            const netAssetValues = [];
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (row && row[netAssetValueIndex] !== undefined && row[netAssetValueIndex] !== null) {
                const value = row[netAssetValueIndex];
                const stringValue = String(value);
                const numericValue = parseFloat(stringValue.replace(/[$,]/g, ''));
                if (!isNaN(numericValue) && numericValue > 0) {
                  netAssetValues.push({
                    quarter: row[1] || '',
                    value: numericValue,
                    formattedValue: stringValue,
                    rowIndex: i
                  });
                }
              }
            }

            if (netAssetValues.length > 0) {
              const latestNetAssetValue = netAssetValues[netAssetValues.length - 1];
              result.savings = {
                latestNetAssetValue: latestNetAssetValue.value,
                latestQuarter: latestNetAssetValue.quarter,
                formattedValue: latestNetAssetValue.formattedValue,
                totalEntries: netAssetValues.length
              };
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully read ${availableSheets.length} sheets: ${availableSheets.join(', ')}`
    });

  } catch (error: any) {
    console.error('Read All Sheets error:', error);
    
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
      { error: error.message || 'Failed to read Google Sheets' },
      { status: 500 }
    );
  }
} 