interface CurrencyConversionResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Extract a clean 3-letter currency code from text that might contain amounts or other words
 * @param currencyText - Text that might contain currency code like "USD 11.46 CONVERTED AT 0.58"
 * @returns Clean 3-letter currency code or null if not found
 */
export function extractCurrencyCode(currencyText: string): string | null {
  if (!currencyText || typeof currencyText !== 'string') {
    return null;
  }

  // Remove extra whitespace and convert to uppercase
  const cleanText = currencyText.trim().toUpperCase();
  
  // Common currency codes (ISO 4217)
  const currencyCodes = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
    'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL', 'TWD', 'DKK',
    'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 'AED', 'COP',
    'SAR', 'MYR', 'RON', 'HRK', 'BGN', 'ISK', 'HKD', 'KRW'
  ];

  // Try to find a currency code in the text
  for (const code of currencyCodes) {
    if (cleanText.includes(code)) {
      return code;
    }
  }

  // If no known currency found, try to extract first 3-letter sequence
  const match = cleanText.match(/\b[A-Z]{3}\b/);
  return match ? match[0] : null;
}

/**
 * Convert currency using Frankfurter API with historical rates
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency (3-letter code)
 * @param toCurrency - Target currency (3-letter code)  
 * @param date - Date for historical rate (YYYY-MM-DD format)
 * @returns Promise<number> - Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<number> {
  // Clean and extract currency codes
  const cleanFromCurrency = extractCurrencyCode(fromCurrency);
  const cleanToCurrency = extractCurrencyCode(toCurrency);

  if (!cleanFromCurrency || !cleanToCurrency) {
    console.warn('Invalid currency codes:', { fromCurrency, toCurrency, cleanFromCurrency, cleanToCurrency });
    return amount; // Return original amount if currencies are invalid
  }

  // If currencies are the same, no conversion needed
  if (cleanFromCurrency === cleanToCurrency) {
    return amount;
  }

  try {
    // Use historical rate if date provided, otherwise latest rate
    const endpoint = date 
      ? `https://api.frankfurter.dev/v1/${date}?base=${cleanFromCurrency}&symbols=${cleanToCurrency}`
      : `https://api.frankfurter.dev/v1/latest?base=${cleanFromCurrency}&symbols=${cleanToCurrency}`;

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Currency API error: ${response.status} ${response.statusText}`);
    }

    const data: CurrencyConversionResponse = await response.json();
    const rate = data.rates[cleanToCurrency];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${cleanFromCurrency} to ${cleanToCurrency}`);
    }

    return amount * rate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Return original amount if conversion fails
    return amount;
  }
}

/**
 * Get list of supported currencies from Frankfurter API
 * @returns Promise<Record<string, string>> - Currency codes and their full names
 */
export async function getSupportedCurrencies(): Promise<Record<string, string>> {
  try {
    const response = await fetch('https://api.frankfurter.dev/v1/currencies');
    
    if (!response.ok) {
      throw new Error(`Currency API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    // Return common currencies as fallback
    return {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'AUD': 'Australian Dollar',
      'CAD': 'Canadian Dollar',
      'JPY': 'Japanese Yen',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'NZD': 'New Zealand Dollar',
      'SGD': 'Singapore Dollar'
    };
  }
}

/**
 * Validate if a currency code is supported
 * @param currencyCode - 3-letter currency code
 * @returns Promise<boolean> - Whether the currency is supported
 */
export async function isCurrencySupported(currencyCode: string): Promise<boolean> {
  try {
    const currencies = await getSupportedCurrencies();
    const cleanCode = extractCurrencyCode(currencyCode);
    return cleanCode ? cleanCode in currencies : false;
  } catch (error) {
    console.error('Error checking currency support:', error);
    return false;
  }
} 