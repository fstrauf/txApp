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

    // Read all data from the Expense-Detail sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Expense-Detail!A:H', // All columns A through H
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json(
        { error: 'No data found in Expense-Detail sheet' },
        { status: 400 }
      );
    }

    // Expected columns: Source, Date, Narrative, Amount Spent, Category, Currency Spent, Amount in Base Currency: AUD, [empty]
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== '')); // Filter out empty rows

    console.log('Headers found:', headers);
    console.log('Data rows count:', dataRows.length);
    
    // Log some sample data to understand the format
    if (dataRows.length > 0) {
      console.log('Sample row data:', dataRows[0]);
      const amountIndex = headers.indexOf('Amount Spent');
      const baseAmountIndex = headers.findIndex(h => h.includes('Amount in Base Currency'));
      console.log('Sample amounts:', {
        amountSpent: dataRows[0][amountIndex],
        baseAmount: baseAmountIndex >= 0 ? dataRows[0][baseAmountIndex] : 'N/A'
      });
    }

    // Validate that we have the expected columns
    const expectedColumns = ['Source', 'Date', 'Narrative', 'Amount Spent', 'Category'];
    const missingColumns = expectedColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required columns: ${missingColumns.join(', ')}. Please use the ExpenseSorted template format.`,
          foundHeaders: headers
        },
        { status: 400 }
      );
    }

    // Convert to our standard transaction format
    const transactions: Transaction[] = dataRows.map((row, index) => {
      // Find column indices
      const sourceIndex = headers.indexOf('Source');
      const dateIndex = headers.indexOf('Date');
      const narrativeIndex = headers.indexOf('Narrative');
      const amountIndex = headers.indexOf('Amount Spent');
      const categoryIndex = headers.indexOf('Category');
      const currencyIndex = headers.indexOf('Currency Spent');
      const baseAmountIndex = headers.findIndex(h => h.includes('Amount in Base Currency'));

      // Extract values
      const source = row[sourceIndex] || '';
      const date = row[dateIndex] || '';
      const narrative = row[narrativeIndex] || '';
      const amount = parseFloat(row[amountIndex] || '0');
      const category = row[categoryIndex] || 'Uncategorized';
      const currency = row[currencyIndex] || 'AUD';
      const baseAmount = baseAmountIndex >= 0 ? parseFloat(row[baseAmountIndex] || '0') : amount;

      // Validate required fields
      if (!date || isNaN(amount)) {
        console.warn(`Skipping invalid row ${index + 2}: missing date or invalid amount`, { date, amount: row[amountIndex] });
        return null;
      }

      // Use the base currency amount if available, otherwise use the original amount
      const finalAmount = !isNaN(baseAmount) && baseAmount !== 0 ? baseAmount : amount;
      
      // For Expense-Detail sheets, we need to determine expense vs income
      // Convention 1: Positive = expenses, Negative = income/refunds
      // Convention 2: All positive in "Amount Spent" column (expenses only)
      // We'll use the sign of the amount to determine transaction type
      const isExpense = finalAmount > 0;
      
      // Debug logging for the first few transactions
      if (index < 3) {
        console.log(`Transaction ${index + 1}:`, {
          narrative,
          originalAmount: amount,
          baseAmount,
          finalAmount,
          isExpense,
          absoluteAmount: Math.abs(finalAmount)
        });
      }

      return {
        id: `sheet-${spreadsheetId}-${index + 2}`, // Use row number as part of ID
        date: date.toString(),
        description: narrative.toString(),
        amount: Math.abs(finalAmount), // Always store as positive
        category: category.toString(),
        account: source.toString() || 'Google Sheets Import',
        isDebit: isExpense // true for expenses (positive amounts), false for income (negative amounts)
      };
    }).filter((t): t is Transaction => t !== null); // Remove null entries

    console.log('Converted transactions:', transactions.length);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found. Please check your data format.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions,
      transactionCount: transactions.length,
      spreadsheetId,
      sheetName: 'Expense-Detail',
      message: `Successfully imported ${transactions.length} transactions from Expense-Detail sheet`
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