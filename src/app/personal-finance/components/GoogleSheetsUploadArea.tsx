import { useState } from 'react';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

interface GoogleSheetsUploadAreaProps {
  onTransactionsSelect: (transactions: any[]) => void;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

export function GoogleSheetsUploadArea({ onTransactionsSelect }: GoogleSheetsUploadAreaProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  const extractSpreadsheetId = (url: string): string | null => {
    // Extract spreadsheet ID from various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleImportSheet = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL or ID');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl.trim());
    if (!spreadsheetId) {
      setError('Invalid Google Sheets URL. Please enter a valid URL or spreadsheet ID.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use centralized token handling that automatically handles expired/missing tokens
      console.log('Requesting Google Sheets permissions...');
      const accessToken = await requestSpreadsheetAccess();
      
      if (!accessToken) {
        throw new Error('Unable to get valid Google access token. Please grant access to Google Sheets and try again.');
      }

      // Call our API to read from the Google Sheet
      const response = await fetch('/api/sheets/read-expense-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          spreadsheetId,
          baseCurrency: 'USD' // Default fallback, ideally this should come from user settings
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to read Google Sheet');
      }

      if (!data.transactions || data.transactions.length === 0) {
        setError('No transactions found in the Expense-Detail sheet. Make sure you\'re using the ExpenseSorted template format.');
        return;
      }

      // Pass the transactions to the parent component
      onTransactionsSelect(data.transactions);
      setError(null);

    } catch (err: any) {
      console.error('Google Sheets import error:', err);
      let errorMessage = err.message || 'Failed to import from Google Sheets';
      
      // Handle specific OAuth/authorization errors
      if (err.message.includes('access token') || err.message.includes('grant access')) {
        errorMessage = 'Google Sheets access required. Please grant permissions and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <svg className="mx-auto h-16 w-16 text-green-600 mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3H5C3.9,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3M14,17H8V15H14V17M16.5,13H7.5V11H16.5V13M16.5,9H7.5V7H16.5V9Z"/>
        </svg>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Import from Google Sheets</h3>
        <p className="text-gray-600 mb-4">
          Connect your existing ExpenseSorted template to analyze your expense data
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-1">Template Required</div>
              <p>This feature currently works only with the ExpenseSorted template format. Make sure your sheet has an "Expense-Detail" tab with the correct column structure.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="sheet-url" className="block text-sm font-medium text-gray-700 mb-2">
            Google Sheets URL or Spreadsheet ID
          </label>
          <input
            id="sheet-url"
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the full URL or just the spreadsheet ID
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleImportSheet}
          disabled={isLoading || !sheetUrl.trim()}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
            isLoading || !sheetUrl.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </div>
          ) : (
            'Import from Google Sheets'
          )}
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>Your Google Sheets data will be imported securely and analyzed locally.</p>
      </div>
    </div>
  );
} 