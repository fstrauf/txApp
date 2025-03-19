"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { CsvUpload } from "@/components/csv-upload";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateForInput } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { TransactionTypeBadge } from "@/components/transaction-type-badge";
import { CategoryList } from "@/components/category-list";

type Category = {
  id: string;
  name: string;
};

type BankAccount = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category: {
    id: string;
    name: string;
  };
  bankAccount: {
    id: string;
    name: string;
  };
};

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  
  // New state for enhancements
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  
  // Edit state
  const [editingTransactions, setEditingTransactions] = useState<Record<string, {
    description: string;
    amount: number;
    date: string;
    categoryId: string;
    type: 'income' | 'expense';
  }>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State to track if we have any future-dated transactions
  const [hasFutureDates, setHasFutureDates] = useState(false);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch transactions
        const txResponse = await fetch("/api/transactions");
        if (!txResponse.ok) throw new Error("Failed to fetch transactions");
        const txData = await txResponse.json();
        setTransactions(txData);
        
        // Fetch categories
        const catResponse = await fetch("/api/categories");
        if (catResponse.ok) {
          const catData = await catResponse.json();
          setCategories(catData);
        }
        
        // Fetch accounts
        const acctResponse = await fetch("/api/accounts");
        if (acctResponse.ok) {
          const acctData = await acctResponse.json();
          setAccounts(acctData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchData();
    }
  }, [session]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransactions(prev => ({
      ...prev,
      [transaction.id]: {
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        date: formatDateForInput(transaction.date),
        categoryId: transaction.category.id,
        type: transaction.type,
      },
    }));
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = (transactionId: string) => {
    setEditingTransactions(prev => {
      const newState = { ...prev };
      delete newState[transactionId];
      return newState;
    });
    setError("");
    setSuccess("");
  };

  const handleSaveEdit = async (transactionId: string) => {
    try {
      setError("");
      
      const transactionData = editingTransactions[transactionId];
      const amount = parseFloat(transactionData.amount.toString());
      if (isNaN(amount)) {
        setError("Invalid amount");
        return;
      }
      
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: transactionData.description,
          amount: amount,
          type: transactionData.type,
          date: transactionData.date,
          categoryId: transactionData.categoryId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update transaction");
      }
      
      const updatedTransaction = await response.json();
      
      // Update the local state
      setTransactions(prev => 
        prev.map(tx => tx.id === transactionId ? updatedTransaction : tx)
      );
      
      setSuccess("Transaction updated successfully");
      handleCancelEdit(transactionId);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to update transaction");
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete transaction");
      }
      
      // Remove from local state
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
      setSuccess("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, transactionId: string) => {
    const { name, value } = e.target;
    setEditingTransactions(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [name]: name === 'amount' ? parseFloat(value) || 0 : value,
      },
    }));
  };

  const handleTypeChange = (transactionId: string, type: 'income' | 'expense') => {
    setEditingTransactions(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        type,
      },
    }));
  };

  // Filter transactions based on search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(tx => 
      formatDate(tx.date).toLowerCase().includes(term) ||
      tx.description.toLowerCase().includes(term) ||
      tx.amount.toString().includes(term) ||
      (tx.category?.name.toLowerCase().includes(term) || false) ||
      (tx.bankAccount?.name.toLowerCase().includes(term) || false)
    );
  }, [transactions, searchTerm]);

  // Filter, sort, search, and paginate transactions
  const processedTransactions = useMemo(() => {
    // First apply filter
    let result = filteredTransactions.filter((transaction) => {
      if (filter === "all") return true;
      if (filter === "income") return transaction.type === "income";
      if (filter === "expense") return transaction.type === "expense";
      return true;
    });
    
    // Sort the data
    result = result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    return result;
  }, [filteredTransactions, filter, sortField, sortDirection]);
  
  // Handle pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedTransactions.slice(startIndex, endIndex);
  }, [processedTransactions, currentPage, itemsPerPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
  
  // Handle sorting
  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to desc by default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle checkbox changes
  const handleSelectTransaction = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  // Handle select all on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedTransactions);
      paginatedTransactions.forEach(tx => newSelected.add(tx.id));
      setSelectedTransactions(newSelected);
    } else {
      // Only deselect items on current page
      const newSelected = new Set(selectedTransactions);
      paginatedTransactions.forEach(tx => newSelected.delete(tx.id));
      setSelectedTransactions(newSelected);
    }
  };

  // Handle bulk category update
  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategoryId || selectedTransactions.size === 0) {
      toast.error("Please select a category and at least one transaction");
      return;
    }
    
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Process transactions one by one
    for (const id of selectedTransactions) {
      try {
        const transaction = transactions.find(tx => tx.id === id);
        if (!transaction) continue;
        
        const response = await fetch(`/api/transactions/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            date: transaction.date,
            categoryId: bulkCategoryId,
          }),
        });
        
        if (!response.ok) {
          errorCount++;
          continue;
        }
        
        const updatedTransaction = await response.json();
        
        // Update local state
        setTransactions(prev => 
          prev.map(tx => tx.id === id ? updatedTransaction : tx)
        );
        
        successCount++;
      } catch (error) {
        console.error("Error updating transaction:", error);
        errorCount++;
      }
    }
    
    setIsLoading(false);
    
    if (successCount > 0) {
      toast.success(`Updated ${successCount} transaction(s) successfully`);
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} transaction(s)`);
    }
    
    // Clear selections after operation
    setSelectedTransactions(new Set());
    setBulkCategoryId("");
  };

  // Function to fix future dates
  const handleFixFutureDates = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Call the API endpoint to fix all future dates
      const response = await fetch('/api/transactions/fix-dates', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fix dates");
      }
      
      const data = await response.json();
      
      // Refresh transactions
      const txResponse = await fetch("/api/transactions");
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData);
        setHasFutureDates(false);
      }
      
      setSuccess(`Fixed dates for ${data.count} transactions`);
    } catch (error) {
      console.error("Error fixing dates:", error);
      setError(error instanceof Error ? error.message : "Failed to fix dates");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "secondary"}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("income")}
            variant={filter === "income" ? "default" : "secondary"}
            size="sm"
          >
            Income
          </Button>
          <Button
            onClick={() => setFilter("expense")}
            variant={filter === "expense" ? "default" : "secondary"}
            size="sm"
          >
            Expenses
          </Button>
        </div>
      </div>
      
      {hasFutureDates && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-yellow-800">Warning: Future-dated Transactions</h3>
              <div className="mt-2 text-yellow-700">
                <p>Some transactions have dates in the future (marked with * in date column). This may be due to incorrect date formatting during import.</p>
                <Button 
                  onClick={handleFixFutureDates}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                >
                  Fix All Future Dates
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          onClick={() => setShowCsvUpload(!showCsvUpload)}
          className="w-full sm:w-auto"
        >
          {showCsvUpload ? "Hide CSV Upload" : "Upload Transactions (CSV)"}
        </Button>
      
        <div className="w-full sm:w-auto max-w-md">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {showCsvUpload && (
        <div className="mb-6">
          <CsvUpload />
        </div>
      )}
      
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center">
          <p>Loading transactions...</p>
        </div>
      ) : processedTransactions.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-lg font-semibold">No transactions found</h2>
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Add your first transaction to get started."
              : `No ${filter} transactions found.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="p-3 text-left font-medium">
                  <Checkbox
                    checked={paginatedTransactions.length > 0 && 
                      paginatedTransactions.every(tx => selectedTransactions.has(tx.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th 
                  className="p-3 text-left font-medium cursor-pointer hover:bg-secondary/70"
                  onClick={() => handleSort('date')}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-3 text-left font-medium cursor-pointer hover:bg-secondary/70"
                  onClick={() => handleSort('description')}
                >
                  Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium">Category</th>
                <th className="p-3 text-left font-medium">Account</th>
                <th 
                  className="p-3 text-right font-medium cursor-pointer hover:bg-secondary/70"
                  onClick={() => handleSort('amount')}
                >
                  Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {isLoading ? "Loading transactions..." : "No transactions found."}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const isEditing = !!editingTransactions[transaction.id];
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-secondary/10">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                        />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="date"
                            name="date"
                            value={editingTransactions[transaction.id].date}
                            onChange={(e) => handleInputChange(e, transaction.id)}
                            className="w-full"
                          />
                        ) : (
                          formatDate(transaction.date)
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            name="description"
                            value={editingTransactions[transaction.id].description}
                            onChange={(e) => handleInputChange(e, transaction.id)}
                            className="w-full"
                          />
                        ) : (
                          transaction.description
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 mb-2">
                            <Button 
                              size="sm" 
                              variant={editingTransactions[transaction.id].type === 'income' ? 'default' : 'outline'}
                              onClick={() => handleTypeChange(transaction.id, 'income')}
                              className="w-20"
                            >
                              Income
                            </Button>
                            <Button 
                              size="sm" 
                              variant={editingTransactions[transaction.id].type === 'expense' ? 'default' : 'outline'}
                              onClick={() => handleTypeChange(transaction.id, 'expense')}
                              className="w-20"
                            >
                              Expense
                            </Button>
                          </div>
                        ) : null}
                        {isEditing ? (
                          <div className="w-full max-h-32 overflow-y-auto border rounded-md p-2">
                            <CategoryList 
                              categories={categories as any[]} 
                              selectedId={editingTransactions[transaction.id].categoryId}
                              onSelect={(categoryId) => {
                                setEditingTransactions({
                                  ...editingTransactions,
                                  [transaction.id]: {
                                    ...editingTransactions[transaction.id],
                                    categoryId
                                  }
                                });
                              }}
                              className="px-1"
                            />
                          </div>
                        ) : (
                          <CategoryBadge name={transaction.category.name} />
                        )}
                      </td>
                      <td className="p-3">
                        {transaction.bankAccount.name}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={editingTransactions[transaction.id].amount}
                            onChange={(e) => handleInputChange(e, transaction.id)}
                            className="w-full text-right"
                          />
                        ) : (
                          <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                            {transaction.type === 'expense' ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleSaveEdit(transaction.id)}
                              size="sm"
                              disabled={isLoading}
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => handleCancelEdit(transaction.id)}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(transaction)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(transaction.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {processedTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedTransactions.length)} of {processedTransactions.length} transactions
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              First
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <span className="px-4">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Last
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className="w-20"
            >
              {[10, 25, 50, 100].map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* Bulk Edit Controls */}
      {selectedTransactions.size > 0 && (
        <div className="p-4 bg-secondary/20 rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {selectedTransactions.size} transaction(s) selected
            </span>
            <Button
              onClick={() => setSelectedTransactions(new Set())}
              variant="outline"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
          
          <CategoryList 
            categories={categories as any[]} 
            selectedId={bulkCategoryId}
            onSelect={setBulkCategoryId}
          />
          
          <Button
            onClick={handleBulkCategoryUpdate}
            disabled={!bulkCategoryId || isLoading}
            className="w-full sm:w-auto"
          >
            Update Categories
          </Button>
        </div>
      )}
    </div>
  );
} 