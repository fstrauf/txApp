// Simplified Akahu service that works with manual API calls
// This avoids issues with the SDK and gives us more control

// Types based on Akahu API documentation
export interface AkahuTransaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  _account: string;
  balance?: number;
  meta?: {
    particulars?: string;
    code?: string;
    reference?: string;
  };
  category?: {
    groups?: {
      personal_finance?: {
        name: string;
      };
    };
  };
}

export interface AkahuAccount {
  _id: string;
  name: string;
  type: string;
  balance?: {
    current?: number;
  };
  formatted_account?: string;
  connection: {
    _id: string;
    name: string;
    logo?: string;
  };
}

export interface AkahuConnection {
  _id: string;
  name: string;
  logo?: string;
}

export interface AkahuUser {
  _id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface AkahuPaginatedResponse<T> {
  success: boolean;
  items: T[];
  cursor?: {
    next?: string;
  };
}

export class AkahuService {
  private baseUrl = '/api/akahu'; // Use our Next.js API routes

  constructor() {
    // No need for tokens on client-side since we're using API routes
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`API error (${response.status}):`, errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test connection to Akahu API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean; user?: any }>('/test');
      return response.success === true;
    } catch (error) {
      console.error('Akahu connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all user connections (banks) - extracted from accounts data
   */
  async getConnections(): Promise<AkahuConnection[]> {
    try {
      const accounts = await this.getAccounts();
      
      // Extract unique connections from accounts
      const connectionsMap = new Map<string, AkahuConnection>();
      
      accounts.forEach(account => {
        if (account.connection && !connectionsMap.has(account.connection._id)) {
          connectionsMap.set(account.connection._id, {
            _id: account.connection._id,
            name: account.connection.name,
            logo: account.connection.logo,
          });
        }
      });
      
      return Array.from(connectionsMap.values());
    } catch (error) {
      console.error('Error extracting connections from accounts:', error);
      throw new Error('Failed to fetch bank connections');
    }
  }

  /**
   * Get all accounts across all connections
   */
  async getAccounts(): Promise<AkahuAccount[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; items: AkahuAccount[] }>('/accounts');
      return response.items || [];
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  /**
   * Get transactions for multiple accounts within a date range
   */
  async getTransactions(
    accountIds: string[],
    options?: {
      start?: string;
      end?: string;
      limit?: number;
    }
  ): Promise<AkahuTransaction[]> {
    try {
      // For now, we'll use the months-based endpoint
      // This can be extended later to support custom date ranges
      const months = options?.start ? 
        Math.ceil((new Date().getTime() - new Date(options.start).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 12;
      
      return await this.makeRequest<AkahuTransaction[]>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          accountIds,
          months: Math.min(months, 24) // Limit to 24 months max
        }),
      });
    } catch (error) {
      console.error('Error fetching Akahu transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get transactions for the last N months
   */
  async getRecentTransactions(
    accountIds: string[],
    months: number = 12
  ): Promise<AkahuTransaction[]> {
    try {
      console.log('Fetching transactions for accounts:', accountIds, 'months:', months);
      
      const response = await this.makeRequest<AkahuTransaction[]>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          accountIds,
          months
        }),
      });

      console.log('Received transactions:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw new Error('Failed to fetch recent transactions');
    }
  }

  /**
   * Convert Akahu transactions to a format compatible with existing analysis
   */
  static formatTransactionsForAnalysis(transactions: AkahuTransaction[]) {
    return transactions.map(transaction => ({
      id: transaction._id,
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount), // Make positive for analysis
      type: transaction.type,
      category: transaction.category?.groups?.personal_finance?.name || 'Uncategorized',
      account: transaction._account,
      balance: transaction.balance || 0,
      // Additional metadata that might be useful
      particulars: transaction.meta?.particulars,
      code: transaction.meta?.code,
      reference: transaction.meta?.reference,
      isDebit: transaction.amount < 0,
    }));
  }
}

// Export a singleton instance
export const akahuService = new AkahuService();
