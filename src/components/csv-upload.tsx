"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvExample } from "./csv-example";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function CsvUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type !== "text/csv") {
      setError("Please upload a CSV file");
      setFile(null);
      return;
    }
    setFile(selectedFile || null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("csv", file);
    formData.append("dateFormat", dateFormat);

    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload CSV");
      }

      setSuccess(`Successfully imported ${data.count} transactions`);
      router.refresh();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError(error instanceof Error ? error.message : "Failed to upload CSV");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Import Transactions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file containing your transactions. We support various formats including bank exports.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <strong>Tip:</strong> We support various formats for negative values including minus sign (-100) and accounting notation with parentheses ((100)).
        </p>
      </div>

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

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="csv" className="text-sm font-medium">
              Select a CSV file
            </label>
            <input
              type="file"
              id="csv"
              accept=".csv"
              onChange={handleFileChange}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="dateFormat" className="text-sm font-medium">
              Select date format in your CSV
            </label>
            <Select
              id="dateFormat"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/12/2023)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/31/2023)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-12-31)</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD (e.g., 2023/12/31)</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choosing the correct date format ensures your transactions are imported with the right dates.
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !file}
            className="mt-4"
          >
            {isLoading ? "Uploading..." : "Upload CSV"}
          </Button>
        </div>
      </form>

      <CsvExample dateFormat={dateFormat} />
    </div>
  );
} 