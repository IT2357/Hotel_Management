import { startOfDay, endOfDay, subDays, subMonths, subYears } from 'date-fns';

/**
 * Validate and parse date range
 */
export const validateDateRange = (startDate, endDate) => {
  // Set default date range if not provided (last 30 days)
  let start = startDate ? new Date(startDate) : subDays(new Date(), 30);
  let end = endDate ? new Date(endDate) : new Date();

  // Validate date formats
  if (isNaN(start.getTime())) {
    return {
      isValid: false,
      message: 'Invalid start date format. Use YYYY-MM-DD format.'
    };
  }

  if (isNaN(end.getTime())) {
    return {
      isValid: false,
      message: 'Invalid end date format. Use YYYY-MM-DD format.'
    };
  }

  // Normalize to start/end of day
  start = startOfDay(start);
  end = endOfDay(end);

  // Validate date logic
  if (start > end) {
    return {
      isValid: false,
      message: 'Start date must be before or equal to end date.'
    };
  }

  // Check for reasonable date range (not too far in the past or future)
  const twoYearsAgo = subYears(new Date(), 2);
  const oneYearFromNow = subYears(new Date(), -1);

  if (start < twoYearsAgo) {
    return {
      isValid: false,
      message: 'Start date cannot be more than 2 years in the past.'
    };
  }

  if (end > oneYearFromNow) {
    return {
      isValid: false,
      message: 'End date cannot be more than 1 year in the future.'
    };
  }

  // Limit date range to prevent excessive queries
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return {
      isValid: false,
      message: 'Date range cannot exceed 365 days.'
    };
  }

  return {
    isValid: true,
    startDate: start,
    endDate: end,
    daysDifference: daysDiff
  };
};

/**
 * Validate report filters
 */
export const validateReportFilters = (filters) => {
  const allowedPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
  const allowedGroupBy = ['date', 'channel', 'department', 'status', 'category'];

  if (filters.period && !allowedPeriods.includes(filters.period)) {
    return {
      isValid: false,
      message: `Invalid period. Must be one of: ${allowedPeriods.join(', ')}`
    };
  }

  if (filters.groupBy && !allowedGroupBy.includes(filters.groupBy)) {
    return {
      isValid: false,
      message: `Invalid groupBy. Must be one of: ${allowedGroupBy.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Sri Lankan format)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+94|0)([1-9]\d{8})$/;
  return phoneRegex.test(phone);
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate numeric values with range
 */
export const validateNumericRange = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return {
      isValid: false,
      message: 'Value must be a valid number'
    };
  }

  if (num < min || num > max) {
    return {
      isValid: false,
      message: `Value must be between ${min} and ${max}`
    };
  }

  return {
    isValid: true,
    value: num
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  if (pageNum < 1) {
    return {
      isValid: false,
      message: 'Page must be greater than 0'
    };
  }

  if (limitNum < 1 || limitNum > 100) {
    return {
      isValid: false,
      message: 'Limit must be between 1 and 100'
    };
  }

  return {
    isValid: true,
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
};

/**
 * Validate currency amount
 */
export const validateCurrency = (amount) => {
  const num = parseFloat(amount);
  
  if (isNaN(num) || num < 0) {
    return {
      isValid: false,
      message: 'Amount must be a positive number'
    };
  }

  // Round to 2 decimal places for currency
  return {
    isValid: true,
    value: Math.round(num * 100) / 100
  };
};

/**
 * Validate percentage value
 */
export const validatePercentage = (value) => {
  const num = parseFloat(value);
  
  if (isNaN(num) || num < 0 || num > 100) {
    return {
      isValid: false,
      message: 'Percentage must be between 0 and 100'
    };
  }

  return {
    isValid: true,
    value: num
  };
};