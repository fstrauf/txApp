// CSV validation utilities for personal finance transaction uploads
import Papa from 'papaparse';

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    size: number;
    name: string;
    type: string;
  };
  structure?: {
    rows: number;
    columns: number;
    headers: string[];
    delimiter: string;
    previewData: any[];
  };
  detectedPatterns?: {
    dateColumns: string[];
    amountColumns: string[];
    descriptionColumns: string[];
    directionColumns: string[];
    balanceColumns: string[];
  };
}

export interface ExpectedColumns {
  required: string[];
  optional: string[];
  patterns: {
    date: RegExp[];
    amount: RegExp[];
    description: RegExp[];
    direction: RegExp[];
    balance: RegExp[];
  };
}

// Enhanced patterns for various bank and financial service CSV exports
const FINANCIAL_PATTERNS: ExpectedColumns = {
  required: ['date', 'amount', 'description'],
  optional: ['balance', 'reference', 'code', 'particulars', 'type', 'card', 'direction'],
  patterns: {
    date: [
      /^date$/i,
      /transaction.?date/i,
      /processed.?date/i,
      /value.?date/i,
      /created.?on/i,
      /finished.?on/i,
      /posted.?date/i,
      /effective.?date/i,
      /timestamp/i,
      /booking.?date/i,
      /settlement.?date/i
    ],
    amount: [
      /^amount$/i,
      /^value$/i,
      /debit|credit/i,
      /withdrawal|deposit/i,
      /source.?amount/i,
      /target.?amount/i,
      /transaction.?amount/i,
      /net.?amount/i,
      /gross.?amount/i,
      /after.?fees/i,
      /before.?fees/i,
      /total.?amount/i,
      /payment.?amount/i
    ],
    description: [
      /description/i,
      /narrative/i,
      /details/i,
      /particulars/i,
      /reference/i,
      /memo/i,
      /source.?name/i,
      /target.?name/i,
      /merchant/i,
      /payee/i,
      /counterparty/i,
      /beneficiary/i,
      /other.?party/i
    ],
    direction: [
      /direction/i,
      /type/i,
      /transaction.?type/i,
      /debit.?credit/i,
      /in.?out/i,
      /credit.?debit/i,
      /flow/i,
      /movement/i,
      /entry.?type/i
    ],
    balance: [
      /balance/i,
      /running.?balance/i,
      /account.?balance/i,
      /closing.?balance/i,
      /available.?balance/i,
      /current.?balance/i
    ]
  }
};

/**
 * Detect column patterns in CSV headers
 */
function detectColumnPatterns(headers: string[]): {
  dateColumns: string[];
  amountColumns: string[];
  descriptionColumns: string[];
  directionColumns: string[];
  balanceColumns: string[];
} {
  const patterns = {
    dateColumns: [] as string[],
    amountColumns: [] as string[],
    descriptionColumns: [] as string[],
    directionColumns: [] as string[],
    balanceColumns: [] as string[]
  };

  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Date columns
    if (FINANCIAL_PATTERNS.patterns.date.some(pattern => pattern.test(lowerHeader))) {
      patterns.dateColumns.push(header);
    }
    
    // Amount columns
    if (FINANCIAL_PATTERNS.patterns.amount.some(pattern => pattern.test(lowerHeader))) {
      patterns.amountColumns.push(header);
    }
    
    // Description columns
    if (FINANCIAL_PATTERNS.patterns.description.some(pattern => pattern.test(lowerHeader))) {
      patterns.descriptionColumns.push(header);
    }
    
    // Direction columns (debit/credit, in/out, etc.)
    if (FINANCIAL_PATTERNS.patterns.direction.some(pattern => pattern.test(lowerHeader))) {
      patterns.directionColumns.push(header);
    }
    
    // Balance columns
    if (FINANCIAL_PATTERNS.patterns.balance.some(pattern => pattern.test(lowerHeader))) {
      patterns.balanceColumns.push(header);
    }
  });

  return patterns;
}

/**
 * Analyze direction column values to understand the format
 */
function analyzeDirectionColumn(data: any[], columnName: string): {
  format: 'in_out' | 'debit_credit' | 'positive_negative' | 'unknown';
  values: string[];
  mapping: { [key: string]: 'debit' | 'credit' };
} {
  const values = data
    .map(row => row[columnName])
    .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
    .map(val => String(val).trim().toLowerCase());

  const uniqueValues = [...new Set(values)];
  
  // Detect format based on common patterns
  let format: 'in_out' | 'debit_credit' | 'positive_negative' | 'unknown' = 'unknown';
  let mapping: { [key: string]: 'debit' | 'credit' } = {};

  // Check for IN/OUT pattern (like Wise)
  if (uniqueValues.some(v => ['in', 'out', 'neutral'].includes(v))) {
    format = 'in_out';
    mapping = {
      'in': 'credit',
      'out': 'debit',
      'neutral': 'credit' // Neutral transactions are typically internal transfers
    };
  }
  // Check for DEBIT/CREDIT pattern
  else if (uniqueValues.some(v => ['debit', 'credit', 'dr', 'cr'].includes(v))) {
    format = 'debit_credit';
    mapping = {
      'debit': 'debit',
      'credit': 'credit',
      'dr': 'debit',
      'cr': 'credit'
    };
  }
  // Check for +/- pattern
  else if (uniqueValues.some(v => ['+', '-', 'positive', 'negative'].includes(v))) {
    format = 'positive_negative';
    mapping = {
      '+': 'credit',
      '-': 'debit',
      'positive': 'credit',
      'negative': 'debit'
    };
  }

  return { format, values: uniqueValues, mapping };
}

/**
 * Comprehensive CSV file validation
 */
export async function validateCSVFile(file: File): Promise<CSVValidationResult> {
  const result: CSVValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    fileInfo: {
      size: file.size,
      name: file.name,
      type: file.type
    }
  };

  try {
    // 1. File Type Validation
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/csv') {
      result.errors.push('File must be a CSV file (.csv extension)');
    }

    // 2. File Size Validation (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      result.errors.push(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
    }

    if (file.size === 0) {
      result.errors.push('File is empty');
    }

    // 3. File Content Validation
    const fileText = await file.text();
    
    if (!fileText.trim()) {
      result.errors.push('File contains no data');
      return result;
    }

    // 4. CSV Structure Validation
    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        preview: 100, // Only parse first 100 rows for validation
        dynamicTyping: false, // Keep as strings for validation
        transformHeader: (header: string) => header.trim(),
        complete: resolve,
        error: reject
      });
    });

    if (parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(error => 
        error.type === 'Delimiter' || error.type === 'Quotes'
      );
      
      if (criticalErrors.length > 0) {
        result.errors.push('Invalid CSV format: ' + criticalErrors.map(e => e.message).join(', '));
      } else {
        result.warnings.push('CSV parsing warnings: ' + parseResult.errors.map(e => e.message).join(', '));
      }
    }

    const data = parseResult.data;
    const headers = parseResult.meta.fields || [];

    if (headers.length === 0) {
      result.errors.push('No column headers found in CSV file');
      return result;
    }

    if (data.length === 0) {
      result.errors.push('No data rows found in CSV file');
      return result;
    }

    // 5. Detect column patterns
    const detectedPatterns = detectColumnPatterns(headers);
    result.detectedPatterns = detectedPatterns;

    // 6. Column Structure Validation
    const columnValidation = validateColumns(headers, detectedPatterns);
    result.errors.push(...columnValidation.errors);
    result.warnings.push(...columnValidation.warnings);

    // 7. Data Quality Validation
    const dataValidation = validateDataQuality(data, headers, detectedPatterns);
    result.errors.push(...dataValidation.errors);
    result.warnings.push(...dataValidation.warnings);

    // 8. Set structure info
    result.structure = {
      rows: data.length,
      columns: headers.length,
      headers,
      delimiter: parseResult.meta.delimiter || ',',
      previewData: data.slice(0, 5) // First 5 rows for preview
    };

    // 9. Final validation
    result.isValid = result.errors.length === 0;

    return result;

  } catch (error) {
    result.errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Validate CSV column headers match expected patterns
 */
function validateColumns(headers: string[], detectedPatterns: {
  dateColumns: string[];
  amountColumns: string[];
  descriptionColumns: string[];
  directionColumns: string[];
  balanceColumns: string[];
}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty or duplicate headers
  const cleanHeaders = headers.filter(h => h && h.trim());
  if (cleanHeaders.length !== headers.length) {
    errors.push('CSV contains empty column headers');
  }

  const duplicates = headers.filter((header, index) => 
    headers.indexOf(header) !== index && header.trim()
  );
  if (duplicates.length > 0) {
    errors.push(`Duplicate column headers found: ${duplicates.join(', ')}`);
  }

  // Check for required patterns
  const foundPatterns = {
    date: false,
    amount: false,
    description: false
  };

  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    if (FINANCIAL_PATTERNS.patterns.date.some(pattern => pattern.test(lowerHeader))) {
      foundPatterns.date = true;
    }
    if (FINANCIAL_PATTERNS.patterns.amount.some(pattern => pattern.test(lowerHeader))) {
      foundPatterns.amount = true;
    }
    if (FINANCIAL_PATTERNS.patterns.description.some(pattern => pattern.test(lowerHeader))) {
      foundPatterns.description = true;
    }
  });

  // Check for missing required columns - make this more permissive
  if (!foundPatterns.date) {
    warnings.push('No obvious date column detected. You can map date columns in the next step.');
  }
  if (!foundPatterns.amount) {
    warnings.push('No obvious amount column detected. You can map amount columns in the next step.');
  }
  if (!foundPatterns.description) {
    warnings.push('No obvious description column detected. You can map description columns in the next step.');
  }

  // Warnings for unusual column count
  if (headers.length < 3) {
    warnings.push('CSV has very few columns. Bank exports typically have 4-8 columns.');
  }
  if (headers.length > 15) {
    warnings.push('CSV has many columns. Please ensure this is a bank transaction export.');
  }

  return { errors, warnings };
}

/**
 * Validate data quality in CSV rows
 */
function validateDataQuality(data: any[], headers: string[], detectedPatterns: {
  dateColumns: string[];
  amountColumns: string[];
  descriptionColumns: string[];
  directionColumns: string[];
  balanceColumns: string[];
}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    return { errors: ['No data rows found'], warnings: [] };
  }

  // Check first few rows for data quality
  const sampleSize = Math.min(10, data.length);
  const sampleData = data.slice(0, sampleSize);

  let emptyRowCount = 0;
  let malformedRowCount = 0;

  sampleData.forEach((row, index) => {
    const values = Object.values(row);
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    
    // Check for completely empty rows
    if (nonEmptyValues.length === 0) {
      emptyRowCount++;
    }
    
    // Check for rows with very few values
    if (nonEmptyValues.length < headers.length * 0.3) { // Less than 30% filled
      malformedRowCount++;
    }

    // Check for obvious data format issues
    headers.forEach(header => {
      const value = row[header];
      if (value === null || value === undefined) return;

      const strValue = String(value).trim();
      const lowerHeader = header.toLowerCase();

      // Date validation
      if (FINANCIAL_PATTERNS.patterns.date.some(pattern => pattern.test(lowerHeader))) {
        if (strValue && !isValidDateFormat(strValue)) {
          warnings.push(`Row ${index + 1}: Date value "${strValue}" may not be a valid date format`);
        }
      }

      // Amount validation
      if (FINANCIAL_PATTERNS.patterns.amount.some(pattern => pattern.test(lowerHeader))) {
        if (strValue && !isValidAmountFormat(strValue)) {
          warnings.push(`Row ${index + 1}: Amount value "${strValue}" may not be a valid number`);
        }
      }
    });
  });

  // Report issues
  if (emptyRowCount > sampleSize * 0.5) {
    errors.push(`Too many empty rows found (${emptyRowCount}/${sampleSize} in sample)`);
  }

  if (malformedRowCount > sampleSize * 0.3) {
    warnings.push(`Some rows appear to have missing data (${malformedRowCount}/${sampleSize} in sample)`);
  }

  return { errors, warnings };
}

/**
 * Check if a string looks like a valid date
 */
function isValidDateFormat(value: string): boolean {
  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // 2023-12-31
    /^\d{2}\/\d{2}\/\d{4}/, // 31/12/2023 or 12/31/2023
    /^\d{2}-\d{2}-\d{4}/, // 31-12-2023
    /^\d{1,2}\/\d{1,2}\/\d{4}/, // 1/1/2023
    /^\d{4}\/\d{2}\/\d{2}/, // 2023/12/31
  ];

  return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
}

/**
 * Check if a string looks like a valid amount
 */
function isValidAmountFormat(value: string): boolean {
  // Remove common currency symbols and whitespace
  const cleaned = value.replace(/[$€£¥₹₽＄€￡¥,\s]/g, '');
  
  // Check if it's a valid number (including negative)
  return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
}

/**
 * Get user-friendly suggestions for fixing validation errors
 */
export function getValidationSuggestions(result: CSVValidationResult): string[] {
  const suggestions: string[] = [];

  result.errors.forEach(error => {
    if (error.includes('File must be a CSV')) {
      suggestions.push('Export your bank transactions as a CSV file, not Excel (.xlsx) or PDF');
    }
    if (error.includes('File too large')) {
      suggestions.push('Try exporting a shorter date range or split large files into smaller chunks');
    }
    if (error.includes('No date column')) {
      suggestions.push('Make sure your export includes a date column. Check your bank\'s export settings.');
    }
    if (error.includes('No amount column')) {
      suggestions.push('Ensure your export includes transaction amounts. Some banks have separate debit/credit columns.');
    }
    if (error.includes('No description column')) {
      suggestions.push('Your export should include transaction descriptions or details for categorization.');
    }
    if (error.includes('empty column headers')) {
      suggestions.push('Remove any empty columns from your CSV before uploading.');
    }
  });

  result.warnings.forEach(warning => {
    if (warning.includes('very few columns')) {
      suggestions.push('Standard bank exports have date, amount, description, and balance columns.');
    }
    if (warning.includes('many columns')) {
      suggestions.push('Consider removing unnecessary columns to simplify processing.');
    }
  });

  if (suggestions.length === 0 && result.errors.length > 0) {
    suggestions.push('Please check that you\'ve exported transaction data from your bank in CSV format.');
  }

  return suggestions;
} 