# Google Sheets Integration Setup Guide

## Overview

The Google Sheets integration allows users to save their categorized transactions directly to Google Sheets after uploading and processing CSV files. This feature uses **incremental authorization** - permissions are only requested when the user actually wants to use the feature.

## Features

- **Incremental Authorization**: Only requests Google Sheets permissions when needed
- **Two Options**: Create new sheet or append to existing sheet
- **Smart Formatting**: Automatically formats headers and currency columns
- **Privacy First**: Uses temporary tokens, no stored credentials
- **Error Handling**: Comprehensive error handling for various scenarios

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. OAuth 2.0 Configuration

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for testing (or "Internal" if using Google Workspace)
   - Fill in the app name, user support email, and developer contact
   - Add your domain to authorized domains
   - Add these scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `openid`
     - `email`
     - `profile`
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "TxApp Google Sheets Integration"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 4. NextAuth Configuration (Optional Enhancement)

If you want to integrate with your existing NextAuth setup, update your `[...nextauth].ts`:

```typescript
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Only basic permissions initially - incremental auth handles Sheets
          scope: 'openid email profile'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.scope = account.scope
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.scope = token.scope
      return session
    }
  }
})
```

## How It Works

### User Flow

1. **Upload & Process**: User uploads CSV file and processes transactions
2. **Integration Offer**: System shows attractive "Save to Google Sheets" option
3. **Permission Request**: If user clicks "Yes", system requests Google Sheets permission
4. **Choose Method**: User selects "Create new sheet" or "Add to existing"
5. **Process**: System creates/updates sheet and opens it in new tab

### Technical Flow

1. **Incremental Auth**: Uses Google Identity Services for on-demand permissions
2. **Temporary Tokens**: Receives temporary access token for the session
3. **API Calls**: Makes server-side calls to Google Sheets API with token
4. **Data Processing**: Formats transaction data appropriately for sheets
5. **Sheet Operations**: Creates new sheets or appends to existing ones

## Components Architecture

### Frontend Components

- **`SmartSheetsIntegration`**: Main UI component with step-by-step flow
- **`useIncrementalAuth`**: Hook for managing Google OAuth incremental authorization
- **`GoogleIdentityLoader`**: Loads Google Identity Services script

### Backend API Routes

- **`/api/sheets/create-from-template`**: Creates new Google Sheet with transactions
- **`/api/sheets/append-to-existing`**: Appends transactions to existing sheet

## Data Format

Transactions are saved with these columns:

| Column | Description | Format |
|--------|-------------|---------|
| Date | Transaction date | YYYY-MM-DD |
| Description | Transaction description | Text |
| Amount | Transaction amount | Currency (negative for expenses) |
| Category | AI-categorized category | Text |
| Type | Expense or Income | Text |
| Account | Source account | Text |

## Privacy & Security

- **No Stored Credentials**: Uses temporary tokens only
- **User-Controlled**: User chooses when to grant permissions
- **Minimal Scope**: Only requests Google Sheets access when needed
- **Data Ownership**: User maintains full control of their Google Sheets

## Troubleshooting

### Common Issues

1. **"Google services not loaded"**
   - Ensure internet connection is stable
   - Check that Google Identity Services script loads successfully

2. **"Permission denied"**
   - User declined permissions in popup
   - OAuth configuration issues
   - Incorrect scopes

3. **"Spreadsheet not found"**
   - Invalid Google Sheets URL
   - Sheet not accessible to user
   - Sheet doesn't exist

4. **"Invalid access token"**
   - Token expired (temporary tokens last ~1 hour)
   - OAuth configuration issues

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Test OAuth consent screen configuration
4. Ensure Google Sheets API is enabled
5. Check network requests in developer tools

## Testing

### Development Testing

1. Set up test Google Cloud project
2. Use localhost OAuth configuration
3. Test with small transaction datasets
4. Verify both "create new" and "append existing" flows

### Production Checklist

- [ ] OAuth consent screen approved (if needed)
- [ ] Production URLs added to authorized origins
- [ ] Environment variables configured
- [ ] Google Sheets API enabled
- [ ] Test with real user accounts

## Future Enhancements

- **Template Sheets**: Pre-built sheet templates with charts and formulas
- **Recurring Sync**: Ability to sync new transactions automatically
- **Multiple Sheets**: Support for organizing by account or time period
- **Advanced Formatting**: Custom formatting options for different data types
- **Collaboration**: Share sheets with financial advisors or family members

## Support

If you encounter issues:
1. Check this guide first
2. Review browser console for errors
3. Verify Google Cloud Console configuration
4. Test with a simple Google Sheets operation manually

The integration is designed to be robust and user-friendly, with comprehensive error handling and clear user feedback at each step. 