/**
 * Currency formatting utilities for consistent display across the application
 * Uses dynamic currency settings from the application context
 */

// This will be set by the SettingsProvider when the app loads
let appCurrency = 'LKR';

/**
 * Set the application's default currency
 * @param {string} currency - The currency code to use as default
 */
export const setAppCurrency = (currency) => {
  if (currency) {
    appCurrency = currency.toUpperCase();
  }
};

/**
 * Get the application's default currency
 * @returns {string} The current default currency code
 */
export const getAppCurrency = () => appCurrency;

/**
 * Format a monetary amount with the specified currency
 * @param {number} amount - The amount to format
 * @param {string} [currency] - The currency code (defaults to app settings)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency) => {
  const currencyToUse = currency || appCurrency;
  
  try {
    // Ensure amount is a valid number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
      console.error('Invalid amount provided to formatCurrency:', amount);
      return `${currencyToUse} 0.00`;
    }

    // Special handling for LKR to ensure consistent formatting
    if (currencyToUse === 'LKR' || !currency) {
      return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount).replace('LKR', 'LKR '); // Ensure consistent spacing
    }

    // Fallback for other currencies
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyToUse} ${(amount || 0).toFixed(2)}`;
  }
};

/**
 * Get the currency symbol for a given currency code
 * @param {string} [currency] - The currency code (defaults to app settings)
 * @returns {string} The currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const currencyToUse = currency || appCurrency;
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(0).replace(/[0-9.,\s]/g, '') || currencyToUse;
  } catch (error) {
    console.error('Error getting currency symbol:', error);
    return currencyToUse;
  }
};

/**
 * Parse a formatted currency string back to a number
 * @param {string} value - The formatted currency string
 * @returns {number} The parsed number
 */
export const parseCurrency = (value) => {
  if (!value) return 0;
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(numericValue) || 0;
};

export default {
  formatCurrency,
  getCurrencySymbol,
  parseCurrency,
  setAppCurrency,
  getAppCurrency,
  DEFAULT_CURRENCY: 'LKR'
};