import { NextResponse } from 'next/server';

const TEMPLATE_SPREADSHEET_ID = process.env.TEMPLATE_SPREADSHEET_ID;

export async function GET() {
  try {
    if (!TEMPLATE_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'Template spreadsheet ID not configured' },
        { status: 500 }
      );
    }

    const templateUrl = `https://docs.google.com/spreadsheets/d/${TEMPLATE_SPREADSHEET_ID}/copy`;

    return NextResponse.json({
      success: true,
      templateUrl,
      templateId: TEMPLATE_SPREADSHEET_ID
    });

  } catch (error: any) {
    console.error('Template URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get template URL' },
      { status: 500 }
    );
  }
} 