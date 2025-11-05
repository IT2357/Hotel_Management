// Sri Lankan Currency Utilities for Hotel Management
import { SRI_LANKAN_CURRENCY, PRICE_RANGES } from '../constants/sriLankanHotel';

/**
 * Format amount in Sri Lankan Rupees
 * @param {number} amount - Amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatLKR = (amount, options = {}) => {
  const {
    showSymbol = true,
    showDecimals = false,
    compact = false,
    prefix = 'Rs. ',
    suffix = ''
  } = options;

  if (!amount || isNaN(amount)) {
    return showSymbol ? `${prefix}0${suffix}` : '0';
  }

  // Convert to number and ensure it's positive
  const value = Math.abs(Number(amount));

  // Format for compact notation (e.g., Rs. 1.5K, Rs. 2.3M)
  if (compact && value >= 1000) {
    const units = ['', 'K', 'M', 'B'];
    const unitIndex = Math.floor(Math.log(value) / Math.log(1000));
    const formattedValue = (value / Math.pow(1000, unitIndex)).toFixed(1);
    const unit = units[Math.min(unitIndex, units.length - 1)];
    return showSymbol ? `${prefix}${formattedValue}${unit}${suffix}` : `${formattedValue}${unit}`;
  }

  // Regular formatting with thousand separators
  const formatted = value.toLocaleString('en-LK', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });

  return showSymbol ? `${prefix}${formatted}${suffix}` : formatted;
};

/**
 * Enhanced currency formatter that replaces the existing formatBookingCurrency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (defaults to LKR)
 * @returns {string} Formatted currency string
 */
export const formatBookingCurrency = (amount, currency = 'LKR') => {
  if (currency === 'LKR') {
    return formatLKR(amount, { showSymbol: true, showDecimals: false });
  }
  
  // Fallback for other currencies
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
};

/**
 * Format price range for display
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @param {object} options - Formatting options
 * @returns {string} Formatted price range
 */
export const formatPriceRange = (min, max, options = {}) => {
  const { compact = false, separator = ' - ' } = options;
  
  const minFormatted = formatLKR(min, { compact });
  const maxFormatted = formatLKR(max, { compact });
  
  return `${minFormatted}${separator}${maxFormatted}`;
};

/**
 * Get price category based on amount
 * @param {number} price - Price to categorize
 * @returns {object} Price category information
 */
export const getPriceCategory = (price) => {
  const numPrice = Number(price);
  
  for (const [key, range] of Object.entries(PRICE_RANGES)) {
    if (numPrice >= range.min && numPrice <= range.max) {
      return {
        category: key,
        label: range.label,
        range: range,
        isInRange: true
      };
    }
  }
  
  return {
    category: 'custom',
    label: 'Custom Pricing',
    range: { min: numPrice, max: numPrice },
    isInRange: false
  };
};

/**
 * Calculate seasonal pricing
 * @param {number} basePrice - Base price
 * @param {string} season - Season type
 * @returns {number} Adjusted price
 */
export const calculateSeasonalPrice = (basePrice, season) => {
  const seasonalRates = {
    low: 0.85,     // 15% discount
    standard: 1.0,  // No change
    high: 1.25,    // 25% surcharge
    festival: 1.35  // 35% surcharge
  };
  
  const rate = seasonalRates[season] || 1.0;
  return Math.round(basePrice * rate);
};

/**
 * Calculate total price with taxes and service charges (Sri Lankan standard)
 * @param {number} basePrice - Base room price
 * @param {number} nights - Number of nights
 * @param {object} options - Additional options
 * @returns {object} Price breakdown
 */
export const calculateTotalPrice = (basePrice, nights = 1, options = {}) => {
  const {
    vatRate = 0.15,        // 15% VAT (standard in Sri Lanka)
    serviceChargeRate = 0.10, // 10% service charge
    cityTaxRate = 0.02,    // 2% city tax (if applicable)
    discountRate = 0,      // Discount rate
    seasonalMultiplier = 1.0
  } = options;

  const adjustedBasePrice = basePrice * seasonalMultiplier;
  const subtotal = adjustedBasePrice * nights;
  const discount = subtotal * discountRate;
  const afterDiscount = subtotal - discount;
  
  const serviceCharge = afterDiscount * serviceChargeRate;
  const vat = (afterDiscount + serviceCharge) * vatRate;
  const cityTax = afterDiscount * cityTaxRate;
  
  const total = afterDiscount + serviceCharge + vat + cityTax;

  return {
    basePrice: adjustedBasePrice,
    nights,
    subtotal,
    discount,
    afterDiscount,
    serviceCharge,
    vat,
    cityTax,
    total,
    breakdown: [
      { label: 'Room Cost', amount: afterDiscount },
      { label: 'Service Charge (10%)', amount: serviceCharge },
      { label: 'VAT (15%)', amount: vat },
      ...(cityTax > 0 ? [{ label: 'City Tax (2%)', amount: cityTax }] : []),
      ...(discount > 0 ? [{ label: 'Discount', amount: -discount }] : [])
    ]
  };
};

/**
 * Convert USD to LKR (approximate, should use real exchange rates)
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - Current exchange rate (default: 320)
 * @returns {number} Amount in LKR
 */
export const convertUSDToLKR = (usdAmount, exchangeRate = 320) => {
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Get default price range for filters
 * @returns {array} Default price range [min, max]
 */
export const getDefaultPriceRange = () => {
  return [PRICE_RANGES.budget.min, PRICE_RANGES.luxury.max];
};

/**
 * Validate price input
 * @param {number} price - Price to validate
 * @returns {object} Validation result
 */
export const validatePrice = (price) => {
  const numPrice = Number(price);
  
  if (isNaN(numPrice) || numPrice < 0) {
    return {
      isValid: false,
      error: 'Price must be a valid positive number'
    };
  }
  
  if (numPrice < 1000) {
    return {
      isValid: false,
      error: 'Minimum price is Rs. 1,000'
    };
  }
  
  if (numPrice > 500000) {
    return {
      isValid: false,
      error: 'Maximum price is Rs. 500,000'
    };
  }
  
  return {
    isValid: true,
    category: getPriceCategory(numPrice)
  };
};

/**
 * Format duration in Tamil and English
 * @param {number} nights - Number of nights
 * @returns {object} Formatted duration in both languages
 */
export const formatDuration = (nights) => {
  const tamilNumerals = ['', 'ஒரு', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது', 'பத்து'];
  
  const english = nights === 1 ? '1 Night' : `${nights} Nights`;
  const tamil = nights <= 10 
    ? `${tamilNumerals[nights]} இரவு${nights > 1 ? 'கள்' : ''}`
    : `${nights} இரவுகள்`;
  
  return { english, tamil };
};

export default {
  formatLKR,
  formatBookingCurrency,
  formatPriceRange,
  getPriceCategory,
  calculateSeasonalPrice,
  calculateTotalPrice,
  convertUSDToLKR,
  getDefaultPriceRange,
  validatePrice,
  formatDuration
};