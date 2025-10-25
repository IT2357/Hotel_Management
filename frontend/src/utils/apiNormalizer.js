/**
 * API Response Normalizer Utility
 * Standardizes API response handling across the application
 */

/**
 * Normalize API response data
 * Handles various response formats from different endpoints
 * 
 * @param {Object} response - Axios response object
 * @param {Object} options - Normalization options
 * @returns {Object} - Normalized data with consistent structure
 */
export const normalizeAPIResponse = (response, options = {}) => {
  const {
    expectArray = false,
    expectPagination = false,
    dataKey = 'data',
    fallback = expectArray ? [] : null
  } = options;

  // Handle null/undefined responses
  if (!response) {
    return {
      data: fallback,
      success: false,
      error: 'No response received'
    };
  }

  // Extract the actual data from response
  const responseData = response.data || response;

  // Case 1: Response already has success/data structure
  if (responseData && typeof responseData === 'object') {
    // Check if it's a successful response
    const success = responseData.success !== false;

    // Handle paginated responses
    if (expectPagination && responseData.data) {
      if (Array.isArray(responseData.data)) {
        // Direct array in data field
        return {
          data: responseData.data,
          pagination: {
            total: responseData.total || responseData.data.length,
            page: responseData.page || 1,
            limit: responseData.limit || responseData.data.length,
            pages: responseData.pages || 1
          },
          success,
          message: responseData.message
        };
      } else if (responseData.data.items && Array.isArray(responseData.data.items)) {
        // Nested items array
        return {
          data: responseData.data.items,
          pagination: {
            total: responseData.data.total || responseData.data.items.length,
            page: responseData.data.page || 1,
            limit: responseData.data.limit || responseData.data.items.length,
            pages: responseData.data.pages || 1
          },
          success,
          message: responseData.message
        };
      }
    }

    // Handle direct data field
    if (responseData.data) {
      // Check if data has nested data
      if (responseData.data.data) {
        return {
          data: responseData.data.data,
          success,
          message: responseData.message
        };
      }

      // Direct data field
      return {
        data: responseData.data,
        success,
        message: responseData.message
      };
    }

    // Handle array responses
    if (expectArray && Array.isArray(responseData)) {
      return {
        data: responseData,
        success: true,
        message: null
      };
    }

    // Response might be the data itself
    if (expectArray && !responseData.data && !Array.isArray(responseData)) {
      return {
        data: fallback,
        success: false,
        error: 'Expected array response'
      };
    }

    // Return as-is if it matches expected structure
    return {
      data: responseData,
      success,
      message: responseData.message
    };
  }

  // Fallback for unexpected response format
  return {
    data: fallback,
    success: false,
    error: 'Unexpected response format'
  };
};

/**
 * Normalize menu items response
 * Handles various menu item API response formats
 */
export const normalizeMenuItems = (response) => {
  return normalizeAPIResponse(response, {
    expectArray: true,
    expectPagination: true,
    fallback: []
  });
};

/**
 * Normalize orders response
 * Handles various order API response formats
 */
export const normalizeOrders = (response) => {
  return normalizeAPIResponse(response, {
    expectArray: true,
    expectPagination: true,
    fallback: []
  });
};

/**
 * Normalize categories response
 * Handles various category API response formats
 */
export const normalizeCategories = (response) => {
  return normalizeAPIResponse(response, {
    expectArray: true,
    fallback: []
  });
};

/**
 * Normalize single item response
 * Handles various single item API response formats
 */
export const normalizeSingleItem = (response) => {
  return normalizeAPIResponse(response, {
    expectArray: false,
    fallback: null
  });
};

/**
 * Extract data array from various response formats
 * Quick utility for common use case
 */
export const extractDataArray = (response) => {
  const normalized = normalizeAPIResponse(response, {
    expectArray: true,
    fallback: []
  });
  return normalized.data;
};

/**
 * Extract single data object from response
 * Quick utility for common use case
 */
export const extractDataObject = (response) => {
  const normalized = normalizeAPIResponse(response, {
    expectArray: false,
    fallback: null
  });
  return normalized.data;
};

/**
 * Handle API errors consistently
 */
export const normalizeAPIError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'No response from server',
      status: null,
      data: null
    };
  } else {
    // Error setting up request
    return {
      message: error.message || 'An error occurred',
      status: null,
      data: null
    };
  }
};

export default {
  normalizeAPIResponse,
  normalizeMenuItems,
  normalizeOrders,
  normalizeCategories,
  normalizeSingleItem,
  extractDataArray,
  extractDataObject,
  normalizeAPIError
};


