interface CurrencyConversionResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
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
  // If currencies are the same, no conversion needed
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }

  try {
    // Use historical rate if date provided, otherwise latest rate
    const endpoint = date 
      ? `https://api.frankfurter.dev/v1/${date}?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`
      : `https://api.frankfurter.dev/v1/latest?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`;

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Currency API error: ${response.status} ${response.statusText}`);
    }

    const data: CurrencyConversionResponse = await response.json();
    const rate = data.rates[toCurrency.toUpperCase()];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
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
    return currencyCode.toUpperCase() in currencies;
  } catch (error) {
    console.error('Error checking currency support:', error);
    return false;
  }
} 