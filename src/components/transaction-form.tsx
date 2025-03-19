"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TransactionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
      type: formData.get("type") as "income" | "expense",
      date: formData.get("date") as string,
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      router.refresh();
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium mb-1"
        >
          Type
        </label>
        <Select
          id="type"
          name="type"
          required
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
      </div>
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium mb-1"
        >
          Amount
        </label>
        <Input
          type="number"
          id="amount"
          name="amount"
          required
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium mb-1"
        >
          Description
        </label>
        <Input
          type="text"
          id="description"
          name="description"
          required
          placeholder="e.g., Grocery shopping"
        />
      </div>
      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium mb-1"
        >
          Date
        </label>
        <Input
          type="date"
          id="date"
          name="date"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Adding..." : "Add Transaction"}
      </Button>
    </form>
  );
} 