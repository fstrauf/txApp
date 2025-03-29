'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import TransactionDebug from '@/components/lunch-money/transaction-debug';

export default function LunchMoneyDebugPage() {
  const [categoryData, setCategoryData] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  const [transactionData, setTransactionData] = useState<any>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  
  const [userSession, setUserSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const [lunchMoneyCategories, setLunchMoneyCategories] = useState<any>(null);
  const [lmCategoryLoading, setLmCategoryLoading] = useState(false);
  const [lmCategoryError, setLmCategoryError] = useState<string | null>(null);
  
  const fetchCategories = async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    
    try {
      const response = await fetch('/api/categories');
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        setCategoryData(data);
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        setCategoryError(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCategoryLoading(false);
    }
  };
  
  const fetchTransactions = async () => {
    setTransactionLoading(true);
    setTransactionError(null);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
      
      const response = await fetch(`/api/lunch-money/transactions?${params}`);
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        setTransactionData(data);
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        setTransactionError(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTransactionLoading(false);
    }
  };
  
  const fetchSession = async () => {
    setSessionLoading(true);
    setSessionError(null);
    
    try {
      const response = await fetch('/api/auth/session');
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        setUserSession(data);
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        setSessionError(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setSessionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSessionLoading(false);
    }
  };
  
  const createDefaultCategory = async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Category ' + new Date().toISOString(),
        }),
      });
      
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        alert(`Category created: ${JSON.stringify(data)}`);
        fetchCategories(); // Refresh the list
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        setCategoryError(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setCategoryError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCategoryLoading(false);
    }
  };
  
  const fetchLunchMoneyCategories = async () => {
    setLmCategoryLoading(true);
    setLmCategoryError(null);
    
    try {
      const response = await fetch('/api/lunch-money/categories');
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        setLunchMoneyCategories(data);
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        setLmCategoryError(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error fetching Lunch Money categories:', error);
      setLmCategoryError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLmCategoryLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lunch Money API Debug</h1>
        <div className="space-x-4">
          <Link 
            href="/lunch-money/transactions" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Transactions
          </Link>
          <Link 
            href="/lunch-money/settings" 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <Suspense fallback={<div>Loading debug data...</div>}>
          <TransactionDebug />
        </Suspense>
      </div>
    </div>
  );
} 