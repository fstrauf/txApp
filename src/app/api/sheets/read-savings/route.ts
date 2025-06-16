import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });

    // First, check if the spreadsheet exists and get sheet info
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

    // Find the "Savings" sheet
    const savingsSheet = spreadsheetInfo.data.sheets?.find(
      sheet => sheet.properties?.title === 'Savings'
    );

    if (!savingsSheet) {
      const availableSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title).join(', ') || 'none';
      return NextResponse.json(
        { 
          error: 'Savings sheet not found in this spreadsheet.',
          availableSheets
        },
        { status: 404 }
      );
    }

    // Read the Savings tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Savings!A:Z', // Read all columns to find Net Asset Value
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found in Savings tab' }, { status: 404 });
    }

    // Find the header row and locate Net Asset Value column
    const headerRow = rows[0];
    const netAssetValueIndex = headerRow.findIndex((header: string) => 
      header && header.toLowerCase().includes('net asset value')
    );

    if (netAssetValueIndex === -1) {
      return NextResponse.json({ error: 'Net Asset Value column not found' }, { status: 404 });
    }

    // Extract Net Asset Value data, skipping empty rows and header
    const netAssetValues = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[netAssetValueIndex] !== undefined && row[netAssetValueIndex] !== null) {
        const value = row[netAssetValueIndex];
        // Convert to string first, then parse currency value (remove $ and commas)
        const stringValue = String(value);
        const numericValue = parseFloat(stringValue.replace(/[$,]/g, ''));
        if (!isNaN(numericValue) && numericValue > 0) {
          netAssetValues.push({
            quarter: row[1] || '', // Quarter column
            value: numericValue,
            formattedValue: stringValue,
            rowIndex: i
          });
        }
      }
    }

    if (netAssetValues.length === 0) {
      return NextResponse.json({ error: 'No valid Net Asset Value data found' }, { status: 404 });
    }

    // Get the latest (most recent) Net Asset Value
    const latestNetAssetValue = netAssetValues[netAssetValues.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        latestNetAssetValue: latestNetAssetValue.value,
        latestQuarter: latestNetAssetValue.quarter,
        formattedValue: latestNetAssetValue.formattedValue,
        totalEntries: netAssetValues.length,
        allValues: netAssetValues
      }
    });

  } catch (error: any) {
    console.error('Error reading Savings tab:', error);
    
    if (error.code === 404) {
      return NextResponse.json({ 
        error: 'Savings tab not found. Please ensure your spreadsheet has a "Savings" tab.' 
      }, { status: 404 });
    }
    
    if (error.code === 401 || error.code === 403) {
      return NextResponse.json({ 
        error: 'Google Sheets access expired. Please use "Link Sheet" to reconnect.' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Failed to read Savings tab: ' + error.message 
    }, { status: 500 });
  }
} 