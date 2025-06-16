import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, range, values } = await request.json();
    
    if (!spreadsheetId || !range || !values) {
      return NextResponse.json(
        { error: 'Missing required parameters: spreadsheetId, range, and values' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const accessToken = authHeader.substring(7);

    // Create OAuth2 client with user's access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Update the specified range in the spreadsheet
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({
      updatedCells: response.data.updatedCells,
      updatedRange: response.data.updatedRange,
      success: true,
    });

  } catch (error: any) {
    console.error('Error updating config in spreadsheet:', error);
    
    // Handle specific Google API errors
    if (error.code === 400) {
      return NextResponse.json(
        { error: 'Invalid spreadsheet ID, range, or values' },
        { status: 400 }
      );
    }
    
    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: 'Access denied. Please check spreadsheet permissions.' },
        { status: 403 }
      );
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Spreadsheet or range not found. Make sure the Config tab exists.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update config in spreadsheet' },
      { status: 500 }
    );
  }
} 