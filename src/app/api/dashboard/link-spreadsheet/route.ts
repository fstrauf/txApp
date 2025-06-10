import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { spreadsheetUrl, createNew } = await request.json();

    if (createNew) {
      // TODO: Implement creating new spreadsheet from template
      return NextResponse.json(
        { error: 'Creating new spreadsheets not yet implemented' },
        { status: 501 }
      );
    }

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: 'Spreadsheet URL is required' },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl.trim());
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL. Please enter a valid URL or spreadsheet ID.' },
        { status: 400 }
      );
    }

    // TODO: Validate spreadsheet access with OAuth before saving
    // For now, just save the URL and ID
    
    // Update user record with spreadsheet info
    await db
      .update(users)
      .set({
        spreadsheetUrl: spreadsheetUrl.trim(),
        spreadsheetId,
        lastDataRefresh: new Date(), // Set initial refresh time
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: spreadsheetUrl.trim(),
      message: 'Spreadsheet linked successfully',
    });

  } catch (error) {
    console.error('Error linking spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to link spreadsheet' },
      { status: 500 }
    );
  }
} 