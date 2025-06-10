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

// Helper function to convert Excel serial date to JavaScript Date
function excelSerialToDate(serial: number): Date {
  // Excel serial date starts from 1900-01-01 (serial 1)
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const epoch = new Date(1899, 11, 30); // December 30, 1899
  const jsDate = new Date(epoch.getTime() + (serial * 24 * 60 * 60 * 1000));
  return jsDate;
}

// Helper function to parse date value (handles both serial numbers and date strings)
function parseDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // If it's a number, treat it as Excel serial date
  if (typeof dateValue === 'number') {
    const date = excelSerialToDate(dateValue);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
  
  // If it's already a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return dateValue.toString();
}

// Helper function to parse amount value (handles accounting notation)
function parseAmount(amountValue: any): number {
  if (typeof amountValue === 'number') {
    return amountValue;
  }
  
  if (typeof amountValue !== 'string') {
    return 0;
  }
  
  let cleanAmount = amountValue.toString().trim();
  
  // Handle empty or non-numeric strings
  if (!cleanAmount || cleanAmount === '') {
    return 0;
  }
  
  // Handle accounting notation with parentheses - indicates negative (expense)
  const isParentheses = cleanAmount.startsWith('(') && cleanAmount.endsWith(')');
  if (isParentheses) {
    cleanAmount = cleanAmount.slice(1, -1); // Remove parentheses
  }
  
  // Remove currency symbols, commas, and spaces
  cleanAmount = cleanAmount.replace(/[$,\s]/g, '');
  
  // Parse the number
  const parsed = parseFloat(cleanAmount);
  if (isNaN(parsed)) {
    return 0;
  }
  
  // For accounting notation with parentheses, return negative (expense)
  // For regular negative signs, preserve the sign
  return isParentheses ? -parsed : parsed;
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
      const dateIndex = headers.indexOf('Date');
      const amountIndex = headers.indexOf('Amount Spent');
      const baseAmountIndex = headers.findIndex(h => h.includes('Amount in Base Currency'));
      console.log('Sample data parsing:', {
        rawDate: dataRows[0][dateIndex],
        parsedDate: parseDate(dataRows[0][dateIndex]),
        rawAmount: dataRows[0][amountIndex],
        parsedAmount: parseAmount(dataRows[0][amountIndex]),
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

      // Extract and parse values
      const source = row[sourceIndex] || '';
      const rawDate = row[dateIndex];
      const parsedDate = parseDate(rawDate);
      const narrative = row[narrativeIndex] || '';
      const rawAmount = row[amountIndex];
      const parsedAmount = parseAmount(rawAmount);
      const category = row[categoryIndex] || 'Uncategorized';
      const currency = row[currencyIndex] || 'AUD';
      const baseAmount = baseAmountIndex >= 0 ? parseAmount(row[baseAmountIndex]) : parsedAmount;

      // Validate required fields
      if (!parsedDate || parsedAmount === 0) {
        console.warn(`Skipping row ${index + 2}: missing date or invalid amount`, { 
          rawDate, 
          parsedDate, 
          rawAmount,
          parsedAmount 
        });
        return null;
      }

      // 12-month filtering: Only import transactions from the last 12 months
      const transactionDate = new Date(parsedDate);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      
      if (transactionDate < twelveMonthsAgo) {
        // Skip transactions older than 12 months
        return null;
      }

      // Use the base currency amount if available and valid, otherwise use the original amount
      const finalAmount = !isNaN(baseAmount) && baseAmount !== 0 ? baseAmount : parsedAmount;
      
      // Determine if this is an expense (negative amount) or credit/income (positive amount)
      // In accounting: expenses are negative, income/credits are positive
      const isExpense = finalAmount < 0;
      
      // Debug logging for the first few transactions
      if (index < 3) {
        console.log(`Transaction ${index + 1}:`, {
          narrative,
          rawDate,
          parsedDate,
          rawAmount,
          parsedAmount,
          baseAmount,
          finalAmount,
          isExpense,
          absoluteAmount: Math.abs(finalAmount)
        });
      }

      return {
        id: `sheet-${spreadsheetId}-${index + 2}`, // Use row number as part of ID
        date: parsedDate,
        description: narrative.toString(),
        amount: Math.abs(finalAmount), // Always store as positive
        category: category.toString(),
        account: source.toString() || 'Google Sheets Import',
        isDebit: isExpense // true for expenses (negative amounts), false for income/credits (positive amounts)
      };
    }).filter((t): t is Transaction => t !== null); // Remove null entries (including filtered old transactions)

    console.log('Converted transactions (last 12 months only):', transactions.length);

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