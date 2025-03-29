'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Transaction = {
  id?: string;
  lunchMoneyId: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  lunchMoneyCategory?: string;
  notes?: string;
  category?: { id: string; name: string } | null;
  originalData?: any;
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

export default function TrainPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, string>>({});
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get selected transaction IDs from localStorage
        const storedIds = localStorage.getItem('trainingTransactions');
        if (!storedIds) {
          throw new Error('No transactions selected for training');
        }
        
        const transactionIds = JSON.parse(storedIds) as string[];
        
        // Fetch transactions
        const txResponse = await fetch(`/api/lunch-money/transactions?ids=${transactionIds.join(',')}`);
        if (!txResponse.ok) {
          const errorData = await txResponse.json();
          throw new Error(errorData.error || 'Failed to fetch transactions');
        }
        
        const txData = await txResponse.json();
        
        if (!txData.transactions || !Array.isArray(txData.transactions)) {
          console.error('Invalid response format:', txData);
          throw new Error('Received invalid data format from server');
        }
        
        // Ensure all transaction amounts are numbers
        const formattedTransactions = txData.transactions.map((tx: any) => ({
          ...tx,
          amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount))
        }));
        
        setTransactions(formattedTransactions);
        
        // Initialize category assignments with Lunch Money categories if available
        const initialAssignments: Record<string, string> = {};
        formattedTransactions.forEach((tx: Transaction) => {
          if (tx.lunchMoneyId) {
            initialAssignments[tx.lunchMoneyId] = '';
          }
        });
        setCategoryAssignments(initialAssignments);
        
        // Fetch Lunch Money categories
        const catResponse = await fetch('/api/lunch-money/categories');
        if (!catResponse.ok) {
          const errorData = await catResponse.json();
          throw new Error(errorData.error || 'Failed to fetch Lunch Money categories');
        }
        
        const catData = await catResponse.json();
        if (!catData.categories || !Array.isArray(catData.categories)) {
          console.error('Invalid category data format:', catData);
          throw new Error('Received invalid category data format from server');
        }
        
        if (catData.categories.length === 0) {
          throw new Error('No categories found in your Lunch Money account.');
        }
        
        console.log(`Loaded ${catData.categories.length} Lunch Money categories`);
        setCategories(catData.categories || []);
      } catch (error) {
        console.error('Error loading training data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading training data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCategoryChange = (txId: string, categoryId: string) => {
    setCategoryAssignments(prev => ({
      ...prev,
      [txId]: categoryId
    }));
  };

  const handleTrainModel = async () => {
    // Validate that all transactions have been assigned a category
    const unassignedTransactions = Object.entries(categoryAssignments)
      .filter(([_, categoryId]) => !categoryId)
      .length;
    
    if (unassignedTransactions > 0) {
      setError(`Please assign categories to all ${unassignedTransactions} unassigned transactions.`);
      return;
    }
    
    setTrainingStatus('training');
    setStatusMessage('Training model...');
    setError(null);
    
    try {
      // Prepare training data
      const trainingData = transactions
        .filter(tx => tx.lunchMoneyId && categoryAssignments[tx.lunchMoneyId])
        .map(tx => {
          // Find the selected category
          const selectedCategory = categories.find(
            cat => cat.id === categoryAssignments[tx.lunchMoneyId]
          );
          
          return {
            lunchMoneyId: tx.lunchMoneyId,
            description: tx.description,
            amount: tx.amount,
            date: tx.date,
            type: tx.type,
            categoryId: categoryAssignments[tx.lunchMoneyId],
            categoryName: selectedCategory?.name || '',
            notes: tx.notes || '',
            originalData: tx.originalData
          };
        });
      
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingData }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to train model');
      }
      
      const result = await response.json();
      setTrainingStatus('success');
      setStatusMessage(`Successfully trained model with ${trainingData.length} transactions.`);
      
      // Clear selected transaction IDs from localStorage
      localStorage.removeItem('trainingTransactions');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/lunch-money/transactions');
      }, 2000);
    } catch (error) {
      console.error('Error training model:', error);
      setTrainingStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to train model');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Training Classification Model</h1>
        <div>Loading transactions...</div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Training Classification Model</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <div className="mt-4">
            <Link href="/lunch-money/transactions" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Back to Transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Training Classification Model</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {trainingStatus !== 'idle' && (
        <div className={`mb-6 p-4 rounded ${
          trainingStatus === 'success' ? 'bg-green-50 text-green-700' : 
          trainingStatus === 'error' ? 'bg-red-50 text-red-700' : 
          'bg-blue-50 text-blue-700'
        }`}>
          {statusMessage}
        </div>
      )}
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Assign categories to these {transactions.length} transactions to train your classification model.
          </p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/lunch-money/transactions" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            onClick={handleTrainModel}
            disabled={trainingStatus === 'training' || transactions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
          >
            {trainingStatus === 'training' ? 'Training...' : 'Train Model'}
          </button>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions selected for training.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Lunch Money Category</th>
                <th className="px-4 py-2 text-left">Assign Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.lunchMoneyId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{transaction.description}</td>
                  <td className={`px-4 py-2 ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {typeof transaction.amount === 'number' 
                      ? transaction.amount.toFixed(2) 
                      : parseFloat(String(transaction.amount)).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    {transaction.lunchMoneyCategory || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={categoryAssignments[transaction.lunchMoneyId] || ''}
                      onChange={(e) => handleCategoryChange(transaction.lunchMoneyId, e.target.value)}
                      className={`p-2 border rounded w-full ${
                        !categoryAssignments[transaction.lunchMoneyId] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a category...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 