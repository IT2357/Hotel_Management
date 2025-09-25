// 📁 backend/utils/responseFormatter.js

export const handleError = (
  res,
  error,
  defaultMessage = "Operation failed"
) => {
  console.error(`${defaultMessage}:`, error);

  const statusCode = error.message.includes("not found")
    ? 404
    : error.message.includes("already exists")
    ? 400
    : error.message.includes("Invalid")
    ? 400
    : error.message.includes("Unauthorized")
    ? 401
    : error.message.includes("Forbidden")
    ? 403
    : error.message.includes("already approved")
    ? 400
    : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

export const sendSuccess = (
  res,
  data,
  message = "Operation successful",
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// 📁 backend/utils/responseFormatter.js

/**
 * Format API response with consistent structure
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {string} error - Error details (optional)
 * @returns {Object} Formatted response object
 */
export const formatResponse = (success, message, data = null, error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return response;
};

/**
 * Format paginated response
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination information
 * @returns {Object} Formatted paginated response
 */
export const formatPaginatedResponse = (success, message, items, pagination) => {
  return formatResponse(success, message, {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1
    }
  });
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} error - Error details
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (message, error = null, statusCode = 500) => {
  return {
    success: false,
    message,
    error,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format validation error response
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted validation error response
 */
export const formatValidationError = (errors) => {
  return formatResponse(false, "Validation failed", null, {
    type: "validation",
    errors
  });
};