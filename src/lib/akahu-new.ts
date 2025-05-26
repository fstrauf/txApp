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
  private baseUrl = 'https://api.akahu.io';
  private appToken: string;
  private userToken: string;

  constructor() {
    this.appToken = process.env.NEXT_PUBLIC_AKAHU_APP_TOKEN || process.env.AKAHU_APP_TOKEN || '';
    this.userToken = process.env.NEXT_PUBLIC_AKAHU_USER_TOKEN || process.env.AKAHU_USER_TOKEN || '';
    
    if (!this.appToken) {
      throw new Error('AKAHU_APP_TOKEN is not configured');
    }
    
    if (!this.userToken) {
      throw new Error('AKAHU_USER_TOKEN is not configured');
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: {
      method?: string;
      requiresUserToken?: boolean;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', requiresUserToken = true, params = {} } = options;
    
    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Akahu-ID': this.appToken,
    };

    // Use appropriate token based on endpoint requirements
    if (requiresUserToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    } else {
      headers['Authorization'] = `Bearer ${this.appToken}`;
    }

    console.log(`Making Akahu API request to: ${url.toString()}`);
    console.log('Headers:', headers);

    const response = await fetch(url.toString(), {
      method,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Akahu API error (${response.status}):`, errorText);
      throw new Error(`Akahu API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Test connection to Akahu API by getting user info
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest<AkahuUser>('/v1/me', { requiresUserToken: true });
      return true;
    } catch (error) {
      console.error('Akahu connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all user connections (banks)
   */
  async getConnections(): Promise<AkahuConnection[]> {
    try {
      const response = await this.makeRequest<AkahuConnection[]>('/v1/connections', {
        requiresUserToken: true
      });
      return response;
    } catch (error) {
      console.error('Error fetching Akahu connections:', error);
      throw new Error('Failed to fetch bank connections');
    }
  }

  /**
   * Get all accounts across all connections
   */
  async getAccounts(): Promise<AkahuAccount[]> {
    try {
      const response = await this.makeRequest<AkahuAccount[]>('/v1/accounts', {
        requiresUserToken: true
      });
      return response;
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getAccountTransactions(
    accountId: string,
    options: {
      start?: string;
      end?: string;
      cursor?: string;
    } = {}
  ): Promise<AkahuPaginatedResponse<AkahuTransaction>> {
    try {
      const params: Record<string, string> = {};
      if (options.start) params.start = options.start;
      if (options.end) params.end = options.end;
      if (options.cursor) params.cursor = options.cursor;

      const response = await this.makeRequest<AkahuPaginatedResponse<AkahuTransaction>>(
        `/v1/accounts/${accountId}/transactions`,
        {
          requiresUserToken: true,
          params
        }
      );
      
      return response;
    } catch (error) {
      console.error(`Error fetching transactions for account ${accountId}:`, error);
      throw new Error(`Failed to fetch transactions for account ${accountId}`);
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
      const allTransactions: AkahuTransaction[] = [];
      
      for (const accountId of accountIds) {
        let cursor: string | undefined;
        let hasMore = true;
        
        while (hasMore && allTransactions.length < (options?.limit || 1000)) {
          const response = await this.getAccountTransactions(accountId, {
            start: options?.start,
            end: options?.end,
            cursor,
          });
          
          allTransactions.push(...response.items);
          
          hasMore = !!response.cursor?.next;
          cursor = response.cursor?.next;
        }
      }

      // Sort by date (most recent first)
      return allTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.getTransactions(accountIds, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    });
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
