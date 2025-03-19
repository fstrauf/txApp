import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";
import { parseISO, parse as parseFnDate, format, isValid } from "date-fns";

// Function to parse CSV file
async function parseCSV(file: File): Promise<any[]> {
  try {
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow rows with inconsistent columns
      relax_quotes: true,       // Be more forgiving with quotes
      skip_records_with_error: true // Skip rows that have parsing errors
    });
    return records;
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const csvFile = formData.get("csv") as File;
    const dateFormatStr = formData.get("dateFormat") as string || "DD/MM/YYYY";

    if (!csvFile) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Parse the CSV file
    const transactions = await parseCSV(csvFile);

    if (!transactions || !transactions.length) {
      return NextResponse.json(
        { message: "CSV file is empty or could not be parsed" },
        { status: 400 }
      );
    }

    // Detect column names (case-insensitive)
    const csvColumns = Object.keys(transactions[0] || {});
    const dateColumn = csvColumns.find(col => col.toLowerCase().includes("date"));
    const descriptionColumn = csvColumns.find(col => 
      col.toLowerCase().includes("desc") || 
      col.toLowerCase().includes("narration") || 
      col.toLowerCase().includes("memo") ||
      col.toLowerCase().includes("particulars") ||
      col.toLowerCase().includes("details")
    );
    const amountColumn = csvColumns.find(col => 
      col.toLowerCase().includes("amount") || 
      col.toLowerCase().includes("sum") || 
      col.toLowerCase().includes("value")
    );
    const categoryColumn = csvColumns.find(col => col.toLowerCase().includes("cat"));

    // Validate required columns
    const missingColumns = [];
    if (!dateColumn) missingColumns.push("Date");
    if (!descriptionColumn) missingColumns.push("Description");
    if (!amountColumn) missingColumns.push("Amount");

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          message: `Missing required columns: ${missingColumns.join(", ")}`,
          expectedColumns: ["Date", "Description", "Amount"],
          foundColumns: csvColumns
        },
        { status: 400 }
      );
    }

    // Get or create default bank account
    let bankAccount = await prisma.bankAccount.findFirst({
      where: { userId: user.id },
    });

    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          name: "Default Account",
          type: "Checking",
          userId: user.id,
        },
      });
    }

    // Import transactions
    const importedTransactions = [];
    const errors = [];

    // Parse date based on the user-provided format
    function parseDate(dateValue: string, format: string): Date {
      console.log(`Parsing date: "${dateValue}" with format: "${format}"`);
      const currentYear = new Date().getFullYear();
      
      // First try parsing with date-fns
      try {
        let dateObj: Date;
        
        // Try different formats based on the provided format string
        switch (format) {
          case "DD/MM/YYYY":
            dateObj = parseFnDate(dateValue, 'dd/MM/yyyy', new Date());
            break;
          case "MM/DD/YYYY":
            dateObj = parseFnDate(dateValue, 'MM/dd/yyyy', new Date());
            break;
          case "YYYY-MM-DD":
            dateObj = parseFnDate(dateValue, 'yyyy-MM-dd', new Date());
            break;
          case "YYYY/MM/DD":
            dateObj = parseFnDate(dateValue, 'yyyy/MM/dd', new Date());
            break;
          default:
            // Try ISO format first
            dateObj = parseISO(dateValue);
            break;
        }
        
        // If we have a valid date
        if (isValid(dateObj)) {
          // Ensure future year dates are set to current year
          if (dateObj.getFullYear() > currentYear) {
            dateObj.setFullYear(currentYear);
          }
          
          // Format the date for logging
          const formattedDate = format(dateObj, 'yyyy-MM-dd');
          console.log(`Parsed date result: ${formattedDate}`);
          return dateObj;
        }
      } catch (error) {
        console.warn(`Error parsing with date-fns: ${error}`);
        // Fall through to legacy parser if date-fns failed
      }
      
      // Fall back to our original method if date-fns failed
      try {
        // Try direct parsing which might work for ISO formatted dates
        const directParsed = new Date(dateValue);
        if (!isNaN(directParsed.getTime())) {
          // Ensure date is not in the future
          if (directParsed.getFullYear() > currentYear) {
            // Clone the date but set year to current year
            directParsed.setFullYear(currentYear);
          }
          return directParsed;
        }
        
        // If direct parsing fails, try to parse based on format
        const parts = dateValue.split(/[-\/\.]/);
        if (parts.length !== 3) {
          throw new Error(`Invalid date format: ${dateValue}`);
        }
        
        let year: string, month: string, day: string;
        
        switch (format) {
          case "DD/MM/YYYY":
            day = parts[0];
            month = parts[1];
            year = parts[2];
            break;
          case "MM/DD/YYYY":
            month = parts[0];
            day = parts[1];
            year = parts[2];
            break;
          case "YYYY-MM-DD":
          case "YYYY/MM/DD":
            year = parts[0];
            month = parts[1];
            day = parts[2];
            break;
          default:
            // Default to DD/MM/YYYY if format not recognized
            day = parts[0];
            month = parts[1];
            year = parts[2];
        }
        
        // Handle 2-digit years by setting to current century
        if (year.length === 2) {
          const century = Math.floor(currentYear / 100) * 100;
          year = String(century + parseInt(year, 10));
        }
        
        // Ensure year is not in the future
        const parsedYear = parseInt(year, 10);
        if (parsedYear > currentYear) {
          console.warn(`Year ${parsedYear} is in the future. Adjusting to ${currentYear}.`);
          year = String(currentYear);
        }
        
        // Create a valid date string in ISO format (YYYY-MM-DD)
        const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const result = new Date(isoDateStr);
        
        console.log(`Parsed date result (fallback): ${result.toISOString()}`);
        
        if (isNaN(result.getTime())) {
          throw new Error(`Cannot parse date: ${dateValue} using format ${format}`);
        }
        
        return result;
      } catch (error) {
        console.error(`Failed to parse date "${dateValue}" with format "${format}": ${error}`);
        throw new Error(`Invalid date format: ${dateValue}`);
      }
    }

    for (const [index, record] of transactions.entries()) {
      try {
        // Extract values
        const dateValue = dateColumn ? record[dateColumn] : null;
        const descriptionValue = descriptionColumn ? record[descriptionColumn] || "No description" : "No description";
        const amountValue = amountColumn ? record[amountColumn] : null;
        const categoryValue = categoryColumn ? record[categoryColumn] : undefined;
        
        // Skip rows with missing essential data
        if (!dateValue) {
          throw new Error(`Missing date in row ${index + 2}`);
        }

        // Parse amount - handle different number formats
        let amount: number = 0; // Default to 0

        // Check if amountValue is empty or undefined, but still allow the transaction
        // This handles cases where some transactions might be pending or don't have an amount yet
        if (amountValue === null || amountValue === undefined || amountValue === '') {
          console.log(`Warning: Empty amount in row ${index + 2}, defaulting to 0`);
        } else {
          if (typeof amountValue === 'number') {
            amount = amountValue;
          } else {
            const amountStr = String(amountValue).trim();
            
            // Check if the amount is wrapped in parentheses, which indicates a negative value in accounting notation
            const isParenthesis = amountStr.startsWith('(') && amountStr.endsWith(')');
            
            // Clean the amount string, removing currency symbols, extra spaces, etc.
            let cleanAmount = amountStr
              .replace(/[()$£€]/g, '') // Remove parentheses and currency symbols
              .replace(/,/g, '.') // Replace commas with dots if used as decimal separator
              .trim();
              
            if (cleanAmount === '') {
              amount = 0;
            } else {
              // Parse the cleaned amount
              amount = parseFloat(cleanAmount);
              
              // If the amount was in parentheses, make it negative (if it's not already)
              if (isParenthesis && amount > 0) {
                amount = -amount;
              }
              
              if (isNaN(amount)) {
                throw new Error(`Invalid amount format: ${amountValue} in row ${index + 2}`);
              }
            }
          }
        }
        
        // Parse date using the provided format
        let parsedDate: Date;
        try {
          parsedDate = parseDate(dateValue, dateFormatStr);
        } catch (error) {
          throw new Error(`Invalid date format: ${dateValue} in row ${index + 2}`);
        }

        // Determine transaction type based on amount sign
        // We store amount as absolute value and use type to determine if it's income or expense
        const transactionType = amount >= 0 ? "income" : "expense";
        const absoluteAmount = Math.abs(amount);

        // Find or create category
        let category;
        
        if (categoryValue) {
          // If a category is specified in the CSV, find or create it
          category = await prisma.category.findFirst({
            where: { 
              name: categoryValue,
              userId: user.id
            },
          });
          
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryValue,
                isDefault: false,
                userId: user.id,
              },
            });
          }
        } else {
          // Use default category based on type
          const defaultCategoryName = transactionType === "income" ? "Uncategorized Income" : "Uncategorized Expense";
          
          category = await prisma.category.findFirst({
            where: { 
              name: defaultCategoryName,
              userId: user.id
            },
          });
          
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: defaultCategoryName,
                isDefault: true,
                userId: user.id,
              },
            });
          }
        }

        // Create transaction with type field
        const transaction = await prisma.transaction.create({
          data: {
            amount: absoluteAmount,
            type: transactionType,
            description: descriptionValue,
            date: parsedDate,
            bankAccountId: bankAccount.id,
            categoryId: category.id,
            userId: user.id,
          },
        });

        // Update bank account balance
        await prisma.bankAccount.update({
          where: { id: bankAccount.id },
          data: {
            balance: {
              increment: transactionType === 'income' ? absoluteAmount : -absoluteAmount,
            },
          },
        });

        importedTransactions.push(transaction);
      } catch (error) {
        errors.push({
          row: index + 2, // +2 for header row and 0-based index
          error: error instanceof Error ? error.message : "Unknown error",
          record,
        });
      }
    }

    return NextResponse.json({
      message: "Transactions imported",
      count: importedTransactions.length,
      errors: errors.length > 0 ? errors : undefined,
      skippedRows: errors.length
    });
  } catch (error) {
    console.error("[IMPORT_TRANSACTIONS]", error);
    return NextResponse.json(
      { message: "Error importing transactions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 