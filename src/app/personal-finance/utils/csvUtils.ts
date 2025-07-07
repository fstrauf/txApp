/**
 * Utility functions for CSV processing and data parsing
 */

/**
 * Parses accounting bracket notation where negative amounts are shown in parentheses
 * Examples: (100.00) -> -100.00, 100.00 -> 100.00, (1,234.56) -> -1234.56
 */
export const parseAccountingAmount = (value: string | number): number | null => {
  if (value === null || value === undefined) return null;
  
  const cleanValue = String(value).trim();
  if (!cleanValue) return null;
  
  // Check for bracket notation (negative)
  const bracketMatch = cleanValue.match(/^\(([0-9,]+\.?[0-9]*)\)$/);
  if (bracketMatch) {
    const numericValue = parseFloat(bracketMatch[1].replace(/,/g, ''));
    return isNaN(numericValue) ? null : -numericValue; // Make it negative
  }
  
  // Regular positive/negative amount (handle standard formats)
  const cleanNumeric = cleanValue.replace(/[^\d.-]/g, '');
  const numericValue = parseFloat(cleanNumeric);
  return isNaN(numericValue) ? null : numericValue;
};

/**
 * Detects if a set of values contains accounting bracket notation
 */
export const detectAccountingNotation = (values: (string | number)[]): {
  hasBracketNotation: boolean;
  bracketCount: number;
  totalValues: number;
  sampleBracketValues: string[];
} => {
  const bracketValues: string[] = [];
  let totalValues = 0;

  for (const value of values) {
    const stringValue = String(value || '').trim();
    if (stringValue) {
      totalValues++;
      // Check if value is wrapped in parentheses (accounting notation)
      if (stringValue.match(/^\([0-9,]+\.?[0-9]*\)$/)) {
        bracketValues.push(stringValue);
      }
    }
  }

  return {
    hasBracketNotation: bracketValues.length > 0,
    bracketCount: bracketValues.length,
    totalValues,
    sampleBracketValues: bracketValues.slice(0, 5) // First 5 examples
  };
};

/**
 * Determines the best amount format for a column based on its values
 */
export const detectAmountFormat = (values: (string | number)[]): 'standard' | 'accounting_brackets' => {
  const notation = detectAccountingNotation(values);
  
  // If more than 10% of values use bracket notation, consider it accounting format
  const bracketRatio = notation.totalValues > 0 ? notation.bracketCount / notation.totalValues : 0;
  
  return bracketRatio > 0.1 ? 'accounting_brackets' : 'standard';
};

/**
 * Standardizes amount parsing based on the detected or specified format
 */
export const parseAmount = (
  value: string | number, 
  format: 'standard' | 'accounting_brackets' | 'negate' | 'sign_column' = 'standard'
): number | null => {
  switch (format) {
    case 'accounting_brackets':
      return parseAccountingAmount(value);
    case 'negate':
      const parsed = parseAccountingAmount(value);
      return parsed !== null ? -parsed : null;
    case 'standard':
    default:
      return parseAccountingAmount(value); // This function handles both formats
  }
}; 