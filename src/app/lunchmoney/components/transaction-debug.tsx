'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function TransactionDebug() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Fetch transactions when the component mounts or date range changes
  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });

      const response = await fetch(`/api/lunch-money/raw-transactions?${params}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (!data.transactions || !Array.isArray(data.transactions)) {
        console.error('Invalid response format:', data);
        throw new Error('Received invalid data format from server');
      }
      
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={fetchTransactions}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4 md:mt-auto"
        >
          Fetch Raw Transactions
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found for the selected date range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="mb-4 text-lg font-medium">
            Found {transactions.length} transactions
          </div>
          
          <div className="space-y-4">
            {transactions.slice(0, 10).map((transaction, index) => (
              <div key={transaction.id || index} className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold text-lg mb-2">
                  Transaction #{index + 1}: {transaction.payee || transaction.original_name}
                </h3>
                <pre className="bg-white p-2 rounded overflow-auto max-h-[400px]">
                  {JSON.stringify(transaction, null, 2)}
                </pre>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-semibold">ID:</span> {transaction.id}</p>
                    <p><span className="font-semibold">Date:</span> {transaction.date}</p>
                    <p><span className="font-semibold">Description:</span> {transaction.payee || transaction.original_name}</p>
                    <p><span className="font-semibold">Amount:</span> {transaction.amount}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Category:</span> {transaction.category ? transaction.category.name : 'None'}</p>
                    <p><span className="font-semibold">Category ID:</span> {transaction.category ? transaction.category.id : 'None'}</p>
                    <p><span className="font-semibold">Notes:</span> {transaction.notes || 'None'}</p>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length > 10 && (
              <div className="text-center py-4 text-gray-500">
                Showing first 10 of {transactions.length} transactions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 