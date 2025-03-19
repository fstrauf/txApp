"use client";

import { Button } from "@/components/ui/button";

export function CsvExample({ dateFormat = "DD/MM/YYYY" }: { dateFormat?: string }) {
  // Get current year for examples
  const currentYear = new Date().getFullYear();
  
  // Create a date sample based on the selected format
  const getFormattedDate = (month: number, day: number): string => {
    // Create a date using the current year
    const date = new Date(currentYear, month - 1, day);
    
    switch (dateFormat) {
      case "DD/MM/YYYY":
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case "MM/DD/YYYY":
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      case "YYYY-MM-DD":
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      case "YYYY/MM/DD":
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
      default:
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  };

  const csvContent = `Date,Description,Amount,Category
${getFormattedDate(5, 15)},Grocery Shopping,-42.50,Food
${getFormattedDate(5, 16)},Salary Deposit,1250.00,Income
${getFormattedDate(5, 18)},Restaurant Dinner,(65.75),Dining
${getFormattedDate(5, 20)},Gas Station,-35.25,Transportation
${getFormattedDate(5, 22)},Online Shopping,(98.50),Shopping`;

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example_transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-medium">CSV Example</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Here's an example of what your CSV file should look like with {dateFormat} date format:
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-x-auto mb-4">
        <pre className="text-sm">{csvContent}</pre>
      </div>
      <div className="space-y-2 mb-4">
        <p className="text-sm text-muted-foreground">
          <strong>Notes:</strong>
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>The Category column is optional. If provided, transactions will be assigned to the specified category (creating it if needed).</li>
          <li>Column names are flexible - we'll recognize variations like "Transaction Date" or "Memo" instead of "Description".</li>
          <li><strong>Please ensure your dates are in {dateFormat} format and use the current year ({currentYear}).</strong></li>
          <li>Amount formats with currency symbols ($, €) and thousand separators (,) are supported.</li>
          <li>Negative values can be represented with a minus sign (-42.50) or in accounting notation with parentheses ((42.50)).</li>
          <li>Empty amount fields are allowed and will default to 0.</li>
          <li>The importer will skip rows with errors rather than failing the entire import.</li>
        </ul>
      </div>
      <Button
        onClick={handleDownload}
        variant="secondary"
      >
        Download Example CSV
      </Button>
    </div>
  );
} 