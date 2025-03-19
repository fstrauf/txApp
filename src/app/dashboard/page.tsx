"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TransactionForm } from "@/components/transaction-form";
import { Stats } from "@/components/stats";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type Transaction = {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: {
    name: string;
    type: string;
  };
  bankAccount: {
    name: string;
  };
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/transactions");
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchTransactions();
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  const totalBalance = transactions.reduce((acc, transaction) => {
    return acc + transaction.amount;
  }, 0);

  const monthlyIncome = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      return (
        transaction.amount > 0 &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const monthlyExpenses = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      return (
        transaction.amount < 0 &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((acc, transaction) => acc + Math.abs(transaction.amount), 0);

  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Total Balance
          </h2>
          <p className="text-2xl font-bold">
            ${totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Income (This Month)
          </h2>
          <p className="text-2xl font-bold text-green-600">
            ${monthlyIncome.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Expenses (This Month)
          </h2>
          <p className="text-2xl font-bold text-red-600">
            ${monthlyExpenses.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Savings Rate
          </h2>
          <p className="text-2xl font-bold">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Income vs Expenses</h2>
            <Stats income={monthlyIncome} expenses={monthlyExpenses} />
          </div>
          <div className="rounded-lg border">
            <div className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
              {isLoading ? (
                <p>Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No transactions yet. Add your first transaction to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)} • {transaction.bankAccount.name}
                        </div>
                      </div>
                      <div className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount > 0 ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground">
                      <a href="/transactions" className="text-primary hover:underline">
                        View all {transactions.length} transactions
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Add Transaction</h2>
          <TransactionForm />
        </div>
      </div>
    </div>
  );
} 