"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvExample } from "./csv-example";
import { Button } from "@/components/ui/button";

export function CsvUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [hasHeaders, setHasHeaders] = useState(false);

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

    // First analyze the CSV to understand its structure
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Analyze the CSV structure
      const analyzeResponse = await fetch("/api/transactions/analyze", {
        method: "POST",
        body: formData,
      });

      if (!analyzeResponse.ok) {
        throw new Error("Failed to analyze CSV file");
      }

      const analysisData = await analyzeResponse.json();
      console.log("CSV Analysis:", analysisData);

            // Step 2: Get AI-powered analysis and mapping
      let columnMappings: Record<string, string>;
      let detectedHasHeaders = hasHeaders; // Start with user's preference
      
      try {
        // Convert the parsed data back to raw rows for AI analysis
        const rawRows: string[][] = [];
        
        // Add headers as first row (these might be actual headers or just the first data row)
        if (analysisData.headers) {
          rawRows.push(analysisData.headers);
        }
        
        // Add preview rows (convert from object format back to array format)
        if (analysisData.previewRows) {
          analysisData.previewRows.forEach((row: any) => {
            const rowArray: string[] = [];
            analysisData.headers.forEach((header: string) => {
              rowArray.push(row[header] || '');
            });
            rawRows.push(rowArray);
          });
        }

        const suggestResponse = await fetch("/api/csv/suggest-mappings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rawRows: rawRows.slice(0, 5), // Send first 5 rows
          }),
        });

        if (suggestResponse.ok) {
          const analysis = await suggestResponse.json();
          detectedHasHeaders = analysis.hasHeaders;
          
          console.log("AI Analysis:", {
            detectedHasHeaders: analysis.hasHeaders,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            suggestions: analysis.suggestions
          });
          
          // Use the AI suggestions directly as they should already have the correct header names as keys
          columnMappings = {};
          
          if (analysis.suggestions) {
            Object.entries(analysis.suggestions).forEach(([headerName, mapping]) => {
              if (typeof mapping === 'string') {
                columnMappings[headerName] = mapping;
              }
            });
          }
          
          // If AI detected different header status than user, show a warning but continue
          if (analysis.hasHeaders !== hasHeaders) {
            console.warn(`AI detected headers: ${analysis.hasHeaders}, but user said: ${hasHeaders}. Using AI detection.`);
          }
        } else {
          const errorData = await suggestResponse.json().catch(() => ({ error: 'Unknown error' }));
          
          // Handle quota error gracefully
          if (suggestResponse.status === 429) {
            console.warn("AI service quota exceeded, using fallback logic");
            setError("AI analysis temporarily unavailable. Using basic column detection.");
          } else {
            console.error("AI mapping response error:", errorData.error);
          }
          
          throw new Error("AI mapping failed");
        }
      } catch (aiError) {
        console.log("AI mapping failed, using fallback logic:", aiError);
        // Fallback to rule-based mapping
        detectedHasHeaders = hasHeaders;
        if (hasHeaders && analysisData.headers && analysisData.headers.length > 0) {
          // CSV has headers - map them intelligently
          columnMappings = analysisData.headers.reduce((acc: Record<string, string>, header: string, index: number) => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('date') || index === 0) {
              acc[header] = 'date';
            } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || index === 1) {
              acc[header] = 'amount';
            } else if (lowerHeader.includes('desc') || lowerHeader.includes('narrative') || lowerHeader.includes('payee') || index === 2) {
              acc[header] = 'description';
            } else {
              acc[header] = 'none';
            }
            return acc;
          }, {});
        } else {
          // CSV has no headers - use Papa Parse's default column names (0, 1, 2, etc.)
          const sampleRow = analysisData.previewRows?.[0] || {};
          const keys = Object.keys(sampleRow);
          
          columnMappings = {};
          keys.forEach((key, index) => {
            if (index === 0) {
              columnMappings[key] = 'date';
            } else if (index === 1) {
              columnMappings[key] = 'amount';
            } else if (index === 2) {
              columnMappings[key] = 'description';
            } else {
              columnMappings[key] = 'none';
            }
          });
        }
      }

      console.log("Column Mappings:", columnMappings);

      // Step 3: Import with proper configuration
      const importFormData = new FormData();
      importFormData.append("file", file);
      
      const config = {
        bankAccountId: "00000000-0000-0000-0000-000000000000", // Default bank account ID
        mappings: columnMappings,
        dateFormat: dateFormat,
        amountFormat: "standard", // Preserve the original signs
        skipRows: detectedHasHeaders ? 1 : 0, // Skip header row if AI detected headers
        delimiter: analysisData.detectedDelimiter || ",",
      };
      
      importFormData.append("config", JSON.stringify(config));

      const response = await fetch("/api/transactions/import", {
        method: "POST",
        body: importFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload CSV");
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
            <select
              id="dateFormat"
              value={dateFormat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFormat(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/12/2023)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/31/2023)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2023-12-31)</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD (e.g., 2023/12/31)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Choosing the correct date format ensures your transactions are imported with the right dates.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">CSV Format</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasHeaders"
                checked={hasHeaders}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHasHeaders(e.target.checked)}
                className="rounded border"
              />
              <label htmlFor="hasHeaders" className="text-sm">
                My CSV file has headers in the first row
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Check this if your CSV file has column names like "Date", "Amount", "Description" in the first row.
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