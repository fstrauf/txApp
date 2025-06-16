# Personal Finance Dashboard - Requirements (Updated)

**Core Architecture**: Spreadsheet-centric approach where user transaction data lives in their Google Sheets, accessed via OAuth. No transaction data stored in our database.

## Main Dashboard Flow (/personal-finance)

### 1. User Dashboard Experience
**Route**: `/personal-finance` (reuse existing analytics from `?screen=initialInsights` and `?screen=spendingAnalysisResults`)

#### First-Time Users:
1. Show mock data dashboard preview asking "Would you want this with your data?"
2. **Spreadsheet Setup Options**:
   - **Option A**: Create new spreadsheet from our template
   - **Option B**: Link existing spreadsheet (with structure validation)
3. OAuth authorization for Google Sheets access (read/write permissions)
4. Generate initial dashboard from their spreadsheet data

#### Returning Users:
- **Stored**: `spreadsheetUrl`, `spreadsheetId`, OAuth `refreshToken` in user table
- **Live Data**: All analytics computed from spreadsheet in real-time
- **Dashboard Actions**:
  - **Refresh Data**: Re-read spreadsheet and recompute analytics
  - **Open Sheet**: Direct link to user's Google Spreadsheet  
  - **Explain This**: Help system for understanding their data

### 2. Add New Transaction Data Flow
**Upload Button** → Enhanced upload screen (based on `?screen=spendingAnalysisUpload`)

#### Processing Pipeline:
1. **Upload CSV**: User uploads new bank statement
2. **ML Categorization**:
   - **First Upload**: Use generic auto-classify endpoint (`/auto-classify`)
   - **Subsequent Uploads**: 
     - Read existing categorized transactions from spreadsheet
     - Train custom model via `/api/classify/train` 
     - Categorize new transactions via `/api/classify/classify`
3. **Validation Screen**: Lunchmoney-style interface for validating ML suggestions
4. **Write to Spreadsheet**: Append validated transactions to user's sheet via OAuth
5. **Auto-refresh**: Dashboard updates automatically after write

### 3. Dashboard Analytics (Spreadsheet-Sourced)
**Data Source**: Read directly from user's spreadsheet via OAuth

#### Key Statistics:
- Monthly average income (category=income)
- Monthly average savings (income - expenses)  
- Monthly average expenses (past 12 months)
- Last month expenses
- Annual expense projection (monthly average × 12)

#### Visualizations:
- **Date Filters**: Last month vs. all time
- **Pie Chart**: Expenses by category
- **Transaction List**: All transactions grouped by category, sorted by amount
- **Stacked Bar Chart**: Monthly expenses by category over time

### 4. Data Management
#### Spreadsheet Operations (via OAuth):
- **Read**: Fetch all transaction data for analytics
- **Write**: Append new categorized transactions
- **Validate**: Ensure proper column structure
- **Cache**: Temporarily cache computed analytics for performance

#### User Controls:
- Link/unlink spreadsheet
- Force refresh from spreadsheet
- View spreadsheet directly
- Data validation and error handling

### 5. Email Reminders (Opt-in)
- Monthly maintenance reminders
- Data upload notifications
- Stored in user preferences: `emailRemindersEnabled`

## Technical Implementation

### Database Changes:
**User Table Additions**:
```sql
- spreadsheetUrl: text
- spreadsheetId: text  
- lastDataRefresh: timestamp
- emailRemindersEnabled: boolean
- oauthRefreshToken: encrypted text
```

### API Endpoints:
```
POST /api/dashboard/link-spreadsheet    # Store spreadsheet + OAuth setup
GET /api/dashboard/read-data           # Read from spreadsheet via OAuth  
POST /api/dashboard/append-transactions # Write to spreadsheet
POST /api/dashboard/refresh            # Force refresh from spreadsheet
POST /api/dashboard/email-preferences  # Manage notification settings
```

### Spreadsheet Structure:
```
| Date | Description | Amount | Category | Type | Account | Confidence |
```

### OAuth Integration:
- Extend existing Google Sheets OAuth flow
- Request `spreadsheets` scope for read/write access
- Handle token refresh automatically
- Secure refresh token storage

## Key Benefits:
- **Data Ownership**: Users control their data in their spreadsheets
- **Privacy**: No transaction data in our database
- **Transparency**: Users see exactly where data lives  
- **Flexibility**: Users can edit spreadsheets directly
- **Natural Backup**: Data lives in Google Drive