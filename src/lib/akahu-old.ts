import { AkahuClient } from 'akahu';
import type { Tran  /**
   * Get all accounts across all connections
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await this.userClient.accounts.list();
      return response;
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }ount, Connection, Paginated } from 'akahu';

// Re-export the actual Akahu types for use in components
export type { Transaction as AkahuTransaction, Account as AkahuAccount, Connection as AkahuConnection } from 'akahu';

// Initialize Akahu client
const getAkahuClient = (userToken?: string) => {
  const appToken = process.env.NEXT_PUBLIC_AKAHU_APP_TOKEN || process.env.AKAHU_APP_TOKEN;
  
  if (!appToken) {
    throw new Error('AKAHU_APP_TOKEN is not configured');
  }

  const config: any = { appToken };
  
  // If userToken is provided, include it in the client config
  if (userToken) {
    config.userToken = userToken;
  }

  return new AkahuClient(config);
};

export class AkahuService {
  private appClient: AkahuClient;
  private userClient: AkahuClient;
  private userToken: string;

  constructor() {
    this.userToken = process.env.NEXT_PUBLIC_AKAHU_USER_TOKEN || process.env.AKAHU_USER_TOKEN || '';
    
    if (!this.userToken) {
      throw new Error('AKAHU_USER_TOKEN is not configured');
    }

    // App client for app-level operations
    this.appClient = getAkahuClient();
    // User client for user-specific operations
    this.userClient = getAkahuClient(this.userToken);
  }

  /**
   * Get all user connections (banks)
   */
  async getConnections(): Promise<Connection[]> {
    try {
      const response = await this.userClient.connections.list();
      return response;
    } catch (error) {
      console.error('Error fetching Akahu connections:', error);
      throw new Error('Failed to fetch bank connections');
    }
  }

  /**
   * Get all accounts across all connections
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await this.client.accounts.list(this.userToken);
      return response;
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  /**
   * Get transactions for specific accounts within a date range
   */
  async getTransactions(
    accountIds: string[],
    options?: {
      start?: string; // ISO date string
      end?: string;   // ISO date string
      limit?: number;
    }
  ): Promise<Transaction[]> {
    try {
      const allTransactions: Transaction[] = [];
      
      for (const accountId of accountIds) {
        let cursor: string | undefined;
        let hasMore = true;
        
        while (hasMore && allTransactions.length < (options?.limit || 1000)) {
          const response: Paginated<Transaction> = await this.userClient.accounts.listTransactions(
            accountId, 
            {
              start: options?.start,
              end: options?.end,
              cursor,
            }
          );
          
          allTransactions.push(...response.items);
          
          hasMore = !!response.cursor?.next;
          cursor = response.cursor?.next || undefined;
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
   * Convert Akahu transactions to a format compatible with existing analysis
   */
  static formatTransactionsForAnalysis(transactions: Transaction[]) {
    return transactions.map(transaction => ({
      id: transaction._id,
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount), // Make positive for analysis
      type: transaction.type,
      category: (transaction as any).category?.groups?.personal_finance?.name || 'Uncategorized',
      account: transaction._account,
      balance: transaction.balance || 0,
      // Additional metadata that might be useful
      particulars: (transaction as any).meta?.particulars,
      code: (transaction as any).meta?.code,
      reference: (transaction as any).meta?.reference,
      isDebit: transaction.amount < 0,
    }));
  }

  /**
   * Get transactions for the last N months
   */
  async getRecentTransactions(
    accountIds: string[],
    months: number = 12
  ): Promise<Transaction[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.getTransactions(accountIds, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    });
  }

  /**
   * Test connection to Akahu API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.userClient.users.get();
      return true;
    } catch (error) {
      console.error('Akahu connection test failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const akahuService = new AkahuService();
