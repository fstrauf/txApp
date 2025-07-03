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
import { calculateCompletePortfolioData, type Asset, type AssetAllocation } from '@/app/personal-finance/utils/portfolioCalculations';

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
  assets?: {
    totalValue: number;
    totalAssets: number;
    latestQuarter: string;
    allocation: AssetAllocation[];
    assets: Asset[];
    quarters: string[];
  };
  availableSheets: string[];
  spreadsheetId: string;
  spreadsheetName?: string;
  validationErrors?: {
    sheet: string;
    errors: string[];
    expectedHeaders: string[];
  };
  isExpenseSortedFormat?: boolean;
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
          { 
            error: 'Spreadsheet not found or not accessible',
            errorType: 'ACCESS_DENIED',
            details: 'This could happen for several reasons:',
            reasons: [
              'The spreadsheet URL is incorrect or invalid',
              'The spreadsheet has been deleted or moved',
              'You don\'t have permission to access this spreadsheet',
              'The spreadsheet is private and hasn\'t been shared with you'
            ],
            suggestions: [
              'Double-check the spreadsheet URL',
              'Ask the owner to share the spreadsheet with you',
              'Make sure you\'re signed in to the correct Google account',
              'Try creating a new spreadsheet with our template instead'
            ]
          },
          { status: 404 }
        );
      }
      if (error.code === 403) {
        return NextResponse.json(
          { 
            error: 'Permission denied to access this spreadsheet',
            errorType: 'PERMISSION_DENIED',
            details: 'You don\'t have the necessary permissions to read this spreadsheet.',
            reasons: [
              'The spreadsheet is private and you don\'t have access',
              'Your Google account doesn\'t have read permissions',
              'The spreadsheet owner needs to grant you access'
            ],
            suggestions: [
              'Ask the spreadsheet owner to share it with your email address',
              'Request "Editor" or "Viewer" permissions from the owner',
              'Make sure you\'re signed in to the correct Google account',
              'Try creating a new spreadsheet with our template instead'
            ]
          },
          { status: 403 }
        );
      }
      if (error.code === 401) {
        return NextResponse.json(
          { 
            error: 'Your Google Sheets access has expired',
            errorType: 'AUTH_EXPIRED',
            details: 'Your authorization to access Google Sheets is no longer valid.',
            suggestions: [
              'Click "Re-link Spreadsheet" to refresh your access',
              'Sign out and sign back in to refresh your Google connection',
              'Check if you\'ve revoked access to this app in your Google account settings'
            ]
          },
          { status: 401 }
        );
      }
      throw error;
    }

    const availableSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title).filter((title): title is string => Boolean(title)) || [];
    
    // Check if this looks like our expected format
    const hasExpenseDetailSheet = availableSheets.includes('Expense-Detail');
    const hasConfigSheet = availableSheets.includes('Config');
    const isExpenseSortedFormat = hasExpenseDetailSheet || hasConfigSheet;
    
    const result: AllSheetsData = {
      availableSheets,
      spreadsheetId,
      spreadsheetName: spreadsheetInfo.data.properties?.title || undefined
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
        }).then(response => {
          return { type: 'savings', data: response.data.values };
        }).catch(error => {
          console.error('❌ Error reading Savings sheet:', error);
          throw error;
        })
      );
    }

    // 4. Read Assets sheet if available
    if (availableSheets.includes('Assets')) {
      readPromises.push(
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Assets!A:Z',
          valueRenderOption: 'UNFORMATTED_VALUE'
        }).then(response => ({ type: 'assets', data: response.data.values }))
      );
    }

    // Execute all reads in parallel
    const results = await Promise.allSettled(readPromises);

    // Log any rejected promises
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Promise ${index} rejected:`, result.reason);
      }
    });

    // First, process config data to get base currency
    let baseCurrency = 'USD'; // Default fallback
    for (const promiseResult of results) {
      if (promiseResult.status === 'fulfilled') {
        const { type, data } = promiseResult.value;
        
        if (type === 'config' && data && data.length > 0) {
          // Process Config data - look for base currency in cell B2
          if (data.length >= 2 && data[1] && data[1][1]) {
            const baseCurrencyValue = String(data[1][1]).trim();
            if (baseCurrencyValue && baseCurrencyValue.length === 3) {
              baseCurrency = baseCurrencyValue.toUpperCase();
              result.config = {
                baseCurrency: baseCurrency
              };
            }
          }
          break; // Exit early once we find config
        }
      }
    }

    // Now process other data with the base currency
    for (const promiseResult of results) {
      if (promiseResult.status === 'fulfilled') {
        const { type, data } = promiseResult.value;

        if (type === 'expense-detail' && data && data.length >= 2) {
          // Process Expense-Detail data
          const headers = data[0];
          const headerValidation = validateExpenseDetailHeaders(headers);
          
          if (headerValidation.isValid) {
            const allTransactions = parseExpenseDetailRows(data, spreadsheetId, baseCurrency);
            const recentTransactions = filterRecentTransactions(allTransactions);
            result.transactions = recentTransactions;
            result.transactionCount = recentTransactions.length;
          } else {
            console.error('❌ Header validation failed:', headerValidation.errors);
            // Store validation errors for the response
            result.validationErrors = {
              sheet: 'Expense-Detail',
              errors: headerValidation.errors,
              expectedHeaders: EXPENSE_DETAIL_SCHEMA.headers as any as string[]
            };
          }
        }

        if (type === 'savings' && data && data.length > 0) {
          
          // Find the actual header row (look for "Quarter" column)
          let headerRowIndex = -1;
          let headerRow: any[] = [];
          
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 0) {
              const hasQuarterColumn = row.some((cell: any) => 
                cell && String(cell).toLowerCase().includes('quarter')
              );
              if (hasQuarterColumn) {
                headerRowIndex = i;
                headerRow = row;
                break;
              }
            }
          }
          
          if (headerRowIndex === -1) {
            return;
          }
          
          // First priority: Look for "Liquid Net Asset Value" column for runway calculations
          let netAssetValueIndex = headerRow.findIndex((header: any) => 
            header && String(header).toLowerCase().includes('liquid net asset value')
          );

          // Second priority: Look for regular "Net Asset Value" column
          if (netAssetValueIndex === -1) {
            netAssetValueIndex = headerRow.findIndex((header: any) => 
              header && String(header).toLowerCase().includes('net asset value')
            );
          }

          // Fallback to other common column names
          if (netAssetValueIndex === -1) {
            netAssetValueIndex = headerRow.findIndex((header: any) => 
              header && (
                String(header).toLowerCase().includes('total value') ||
                String(header).toLowerCase().includes('net worth') ||
                String(header).toLowerCase().includes('savings') ||
                String(header).toLowerCase().includes('value') ||
                String(header).toLowerCase().includes('amount')
              )
            );
          }

          if (netAssetValueIndex !== -1) {
            const netAssetValues = [];
            
            // Start from the row after headers and check all rows
            for (let i = headerRowIndex + 1; i < data.length; i++) {
              const row = data[i];
              
              if (row && row[netAssetValueIndex] !== undefined && row[netAssetValueIndex] !== null) {
                const value = row[netAssetValueIndex];
                const stringValue = String(value);
                
                // Skip header-like values that contain text, but be more flexible
                if (stringValue && 
                    !stringValue.toLowerCase().includes('net asset value') && 
                    !stringValue.toLowerCase().includes('value') && 
                    stringValue.trim() !== '') {
                  const numericValue = parseFloat(stringValue.replace(/[$,]/g, ''));
                  
                  if (!isNaN(numericValue) && numericValue > 0) {
                    const entry = {
                      quarter: row[1] || `Row ${i}`, // Quarter is in column 1 (index 1) based on your data structure
                      value: numericValue,
                      formattedValue: stringValue,
                      rowIndex: i
                    };
                    netAssetValues.push(entry);
                  }
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
            } else {
            }
          } else {
            
            // Let's try to calculate from individual asset columns if Net Asset Value column is missing
            const quarterIndex = headerRow.findIndex((header: any) => 
              header && String(header).toLowerCase().includes('quarter')
            );
            
            if (quarterIndex !== -1) {
              
              // Find asset columns (Cash, Crypto, Shares, etc.) and liquid net asset value
              const assetColumnIndices: number[] = [];
              headerRow.forEach((header: any, index: number) => {
                if (header && typeof header === 'string') {
                  const headerLower = header.toLowerCase();
                  if ((headerLower.includes('cash') || 
                       headerLower.includes('crypto') || 
                       headerLower.includes('shares') || 
                       headerLower.includes('retirement') || 
                       headerLower.includes('cars') ||
                       headerLower.includes('deposit') ||
                       headerLower.includes('stock') ||
                       headerLower.includes('bond') ||
                       headerLower.includes('liquid net asset value') ||
                       headerLower.includes('net asset value')) && 
                      index !== quarterIndex) {
                    assetColumnIndices.push(index);
                  }
                }
              });
              
              
              if (assetColumnIndices.length > 0) {
                const calculatedNetAssetValues = [];
                
                for (let i = headerRowIndex + 1; i < data.length; i++) {
                  const row = data[i];
                  if (row && row[quarterIndex]) {
                    let totalValue = 0;
                    let hasValidData = false;
                    
                    // Sum all asset columns for this row
                    for (const colIndex of assetColumnIndices) {
                      if (row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
                        const numericValue = parseFloat(String(row[colIndex]).replace(/[$,]/g, ''));
                        if (!isNaN(numericValue)) {
                          totalValue += numericValue;
                          hasValidData = true;
                        }
                      }
                    }
                    
                    if (hasValidData && totalValue > 0) {
                      calculatedNetAssetValues.push({
                        quarter: row[quarterIndex] || `Row ${i}`,
                        value: totalValue,
                        formattedValue: `$${totalValue.toLocaleString()}`,
                        rowIndex: i
                      });
                    }
                  }
                }                
                
                if (calculatedNetAssetValues.length > 0) {
                  const latestCalculatedValue = calculatedNetAssetValues[calculatedNetAssetValues.length - 1];
                  result.savings = {
                    latestNetAssetValue: latestCalculatedValue.value,
                    latestQuarter: latestCalculatedValue.quarter,
                    formattedValue: latestCalculatedValue.formattedValue,
                    totalEntries: calculatedNetAssetValues.length
                  };
                }
              }
            }
          }
        }

        if (type === 'assets' && data && data.length > 0) {
          // Process Assets data
          
          // Find the header row by looking for the "Quarter" column
          let headerRowIndex = 0;
          let headerRow = data[0];
          
          // Check if the first row has headers, if not check the second row
          const hasQuarterHeader = headerRow && headerRow.some((header: any) => 
            header && String(header).toLowerCase().includes('quarter')
          );
          
          if (!hasQuarterHeader && data.length > 1) {
            headerRowIndex = 1;
            headerRow = data[1];
          }
          
          const getColumnIndex = (columnName: string) => {
            const index = headerRow.findIndex((header: any) => 
              header && String(header).toLowerCase().includes(columnName.toLowerCase())
            );
            return index;
          };

          const quarterIndex = getColumnIndex('quarter');
          const assetTypeIndex = getColumnIndex('asset type');
          const tickerIndex = getColumnIndex('ticker');
          const holdingsIndex = getColumnIndex('holdings');
          const currencyIndex = getColumnIndex('currency');
          const valueIndex = getColumnIndex('value');
          const baseCurrencyIndex = getColumnIndex('value base currency');
          const dateIndex = getColumnIndex('date');

          // Extract and process asset data
          const assets: Asset[] = [];
          
          for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 0) {
              // Check if we have at least the essential data
              const value = row[valueIndex];
              const baseCurrencyValue = row[baseCurrencyIndex];
              
              if (value !== undefined && value !== null && value !== '') {
                const numericValue = parseFloat(String(value).replace(/[$,]/g, ''));
                const numericBaseCurrencyValue = baseCurrencyValue ? 
                  parseFloat(String(baseCurrencyValue).replace(/[$,]/g, '')) : numericValue;
                
                if (!isNaN(numericValue) && numericValue > 0) {
                  const asset = {
                    quarter: row[quarterIndex] || '',
                    assetType: row[assetTypeIndex] || '',
                    ticker: row[tickerIndex] || '',
                    holdings: row[holdingsIndex] || '',
                    currency: row[currencyIndex] || '',
                    value: numericValue,
                    baseCurrencyValue: numericBaseCurrencyValue,
                    formattedValue: String(value),
                    date: row[dateIndex] || '',
                    rowIndex: i
                  };
                  assets.push(asset);
                }
              }
            }
          }

          if (assets.length > 0) {
            // Use centralized calculation for consistency
            const portfolioData = calculateCompletePortfolioData(assets);
            
            result.assets = portfolioData;
            
            // Only use Assets data as fallback if we don't already have Savings data
            // The Savings sheet should take precedence over Assets sheet for net asset value
            if (portfolioData.totalValue > 0 && !result.savings) {
              result.savings = {
                latestNetAssetValue: portfolioData.totalValue,
                latestQuarter: portfolioData.latestQuarter || '',
                formattedValue: `$${portfolioData.totalValue.toLocaleString()}`,
                totalEntries: portfolioData.totalAssets
              };
            } else if (result.savings) {
            }
          }
        }
      }
    }

    // Add format compatibility flag
    result.isExpenseSortedFormat = isExpenseSortedFormat;

    // Check if we have an incompatible format
    if (!isExpenseSortedFormat) {
      return NextResponse.json({
        success: false,
        error: 'Spreadsheet format not compatible',
        errorType: 'INCOMPATIBLE_FORMAT',
        details: 'This spreadsheet doesn\'t have the required Expense Sorted format.',
        data: result,
        reasons: [
          'Missing "Expense-Detail" sheet with transaction data',
          'Missing "Config" sheet with settings',
          'The spreadsheet may be using a different format or template'
        ],
        suggestions: [
          'Create a new spreadsheet using our Expense Sorted template',
          'Convert your existing data to match our format',
          'Upload your CSV/data and we\'ll create a properly formatted spreadsheet for you'
        ],
        availableSheets: availableSheets,
        requiresNewSpreadsheet: true
      }, { status: 422 });
    }

    // If we have validation errors but the basic format is correct
    if (result.validationErrors) {
      return NextResponse.json({
        success: false,
        error: 'Spreadsheet structure needs adjustment',
        errorType: 'STRUCTURE_MISMATCH',
        details: 'The spreadsheet has the right sheets but wrong column headers.',
        data: result,
        validationErrors: result.validationErrors,
        suggestions: [
          'Update your column headers to match our format',
          'Create a new spreadsheet with our template',
          'Upload your data and we\'ll create a properly formatted spreadsheet for you'
        ],
        requiresNewSpreadsheet: true
      }, { status: 422 });
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
      return NextResponse.json({
        error: 'Your Google Sheets access has expired',
        errorType: 'AUTH_EXPIRED',
        details: 'Your authorization to access Google Sheets is no longer valid.',
        suggestions: [
          'Click "Re-link Spreadsheet" to refresh your access',
          'Sign out and sign back in to refresh your Google connection',
          'Check if you\'ve revoked access to this app in your Google account settings'
        ]
      }, { status: 401 });
    }
    
    if (error.code === 403) {
      return NextResponse.json({
        error: 'Insufficient permissions to access Google Sheets',
        errorType: 'PERMISSION_DENIED',
        details: 'You don\'t have the necessary permissions to read from Google Sheets.',
        reasons: [
          'The app doesn\'t have permission to access your Google Sheets',
          'Your Google account settings may have changed',
          'The specific spreadsheet may have restricted access'
        ],
        suggestions: [
          'Grant access to Google Sheets when prompted',
          'Check your Google account permissions for this app',
          'Try re-linking your Google account'
        ]
      }, { status: 403 });
    }

    if (error.code === 404) {
      return NextResponse.json({
        error: 'Spreadsheet not found or not accessible',
        errorType: 'ACCESS_DENIED',
        details: 'The spreadsheet could not be accessed.',
        reasons: [
          'The spreadsheet URL is incorrect or invalid',
          'The spreadsheet has been deleted or moved',
          'You don\'t have permission to access this spreadsheet'
        ],
        suggestions: [
          'Double-check the spreadsheet URL',
          'Ask the owner to share the spreadsheet with you',
          'Try creating a new spreadsheet with our template instead'
        ]
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Unexpected error reading Google Sheets',
      errorType: 'UNKNOWN_ERROR',
      details: error.message || 'An unexpected error occurred while trying to read your spreadsheet.',
      suggestions: [
        'Try refreshing the page and linking again',
        'Check your internet connection',
        'Contact support if the problem persists'
      ]
    }, { status: 500 });
  }
} 