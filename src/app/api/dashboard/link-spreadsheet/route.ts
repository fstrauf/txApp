import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { google } from 'googleapis';

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

const TEMPLATE_SPREADSHEET_ID = process.env.TEMPLATE_SPREADSHEET_ID;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TEMPLATE_SPREADSHEET_ID) {
    return NextResponse.json(
      { error: 'Template spreadsheet ID not configured in environment' },
      { status: 500 }
    );
  }

  try {
    const { spreadsheetUrl, createNew, accessToken, baseCurrency, isPaidUser } = await request.json();

    if (createNew) {
      // Create new spreadsheet from template
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Access token required for creating new spreadsheet' },
          { status: 400 }
        );
      }

      try {
        // Create OAuth2 client with the provided token
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const drive = google.drive({ version: 'v3', auth });

        // Copy the template spreadsheet
        const copiedFile = await drive.files.copy({
          fileId: TEMPLATE_SPREADSHEET_ID,
          requestBody: {
            name: `ExpenseSorted Finance Tracker - ${new Date().toLocaleDateString()}`,
            parents: undefined // Place in user's root Drive folder
          },
          supportsAllDrives: true
        });

        const newSpreadsheetId = copiedFile.data.id!;
        const newSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

        console.log('Successfully created new spreadsheet:', {
          spreadsheetId: newSpreadsheetId,
          spreadsheetUrl: newSpreadsheetUrl,
          isPaidUser: isPaidUser || false,
          baseCurrency: baseCurrency || 'USD'
        });

        // Set base currency in Config tab if provided
        if (baseCurrency) {
          try {
            const sheets = google.sheets({ version: 'v4', auth });
            
            await sheets.spreadsheets.values.update({
              spreadsheetId: newSpreadsheetId,
              range: 'Config!B2',
              valueInputOption: 'RAW',
              requestBody: {
                values: [[baseCurrency.toUpperCase()]]
              }
            });

            console.log('Successfully set base currency:', baseCurrency);
          } catch (currencyError) {
            console.warn('Failed to set base currency in Config tab:', currencyError);
            // Don't fail the entire operation if currency setting fails
          }
        }

        // Clear demo transactions from the template to ensure new users get auto-classify flow
        // This is especially important for paid users who should get a clean experience
        //
        // WHY THIS IS NECESSARY:
        // 1. Template spreadsheets contain demo transactions in the Expense-Detail sheet
        // 2. Our classification logic checks if user has existing data (spreadsheetLinked = true)
        // 3. If existing data is found, it triggers training + classify flow instead of auto-classify
        // 4. New users should always get auto-classify flow regardless of template demo data
        // 5. This ensures consistent behavior: truly new users = auto-classify, existing users = training
        try {
          const sheets = google.sheets({ version: 'v4', auth });
          
          // Clear the Expense-Detail sheet data (keep headers)
          await sheets.spreadsheets.values.clear({
            spreadsheetId: newSpreadsheetId,
            range: 'Expense-Detail!A2:G', // Clear data rows, keep headers in row 1
          });

          console.log('Successfully cleared demo transactions from template', {
            isPaidUser: isPaidUser || false,
            spreadsheetId: newSpreadsheetId,
            reason: 'Ensure auto-classify flow for new users'
          });
        } catch (clearError) {
          console.warn('Failed to clear demo transactions from template:', {
            error: clearError,
            isPaidUser: isPaidUser || false,
            spreadsheetId: newSpreadsheetId
          });
          // Don't fail the entire operation if clearing fails
          // The user can still use the sheet with demo data
        }

        // Update user record with new spreadsheet info
        await db
          .update(users)
          .set({
            spreadsheetUrl: newSpreadsheetUrl,
            spreadsheetId: newSpreadsheetId,
            lastDataRefresh: new Date(),
          })
          .where(eq(users.id, session.user.id));

        return NextResponse.json({
          success: true,
          spreadsheetId: newSpreadsheetId,
          spreadsheetUrl: newSpreadsheetUrl,
          message: 'New spreadsheet created successfully from template',
        });

      } catch (error: any) {
        console.error('Error creating new spreadsheet:', error);
        
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

        return NextResponse.json(
          { error: error.message || 'Failed to create new spreadsheet' },
          { status: 500 }
        );
      }
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