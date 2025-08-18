// 📁 backend/services/error/refundErrorHandler.js
import logger from "../../utils/logger.js";

class RefundErrorHandler {
  /**
   * Handle refund validation errors
   */
  handleValidationError(error, context = {}) {
    const errorInfo = {
      type: "VALIDATION_ERROR",
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Refund validation error", errorInfo);

    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: error.message,
        code: "REFUND_VALIDATION_FAILED",
        details: context,
      },
    };
  }

  /**
   * Handle payment gateway errors
   */
  handlePaymentGatewayError(error, refundId, context = {}) {
    const errorInfo = {
      type: "PAYMENT_GATEWAY_ERROR",
      message: error.message,
      refundId,
      context,
      timestamp: new Date().toISOString(),
      severity: "error",
    };

    logger.error("Payment gateway error during refund processing", errorInfo);

    return {
      success: false,
      error: {
        type: "PAYMENT_GATEWAY_ERROR",
        message: "Payment processing failed. Please try again later.",
        code: "PAYMENT_GATEWAY_FAILED",
        refundId,
        details: {
          originalError: error.message,
          ...context,
        },
      },
    };
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error, operation, context = {}) {
    const errorInfo = {
      type: "DATABASE_ERROR",
      operation,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      severity: "error",
    };

    logger.error("Database error during refund operation", errorInfo);

    return {
      success: false,
      error: {
        type: "DATABASE_ERROR",
        message: "Data operation failed. Please try again.",
        code: "DATABASE_OPERATION_FAILED",
        operation,
        details: context,
      },
    };
  }

  /**
   * Handle business rule violations
   */
  handleBusinessRuleError(rule, violation, context = {}) {
    const errorInfo = {
      type: "BUSINESS_RULE_VIOLATION",
      rule,
      violation,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Business rule violation in refund processing", errorInfo);

    return {
      success: false,
      error: {
        type: "BUSINESS_RULE_VIOLATION",
        message: violation,
        code: `BUSINESS_RULE_${rule.toUpperCase()}`,
        details: context,
      },
    };
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(userId, operation, context = {}) {
    const errorInfo = {
      type: "PERMISSION_ERROR",
      userId,
      operation,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Permission denied for refund operation", errorInfo);

    return {
      success: false,
      error: {
        type: "PERMISSION_ERROR",
        message: "Insufficient permissions for this operation",
        code: "PERMISSION_DENIED",
        operation,
        details: context,
      },
    };
  }

  /**
   * Handle notification errors
   */
  handleNotificationError(error, notificationType, context = {}) {
    const errorInfo = {
      type: "NOTIFICATION_ERROR",
      notificationType,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Notification sending failed", errorInfo);

    // Notification errors shouldn't fail the main operation
    return {
      success: true,
      warning: {
        type: "NOTIFICATION_ERROR",
        message: "Operation completed but notification failed",
        code: "NOTIFICATION_SEND_FAILED",
        details: {
          notificationType,
          originalError: error.message,
          ...context,
        },
      },
    };
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(userId, operation, context = {}) {
    const errorInfo = {
      type: "RATE_LIMIT_ERROR",
      userId,
      operation,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Rate limit exceeded for refund operation", errorInfo);

    return {
      success: false,
      error: {
        type: "RATE_LIMIT_ERROR",
        message: "Too many requests. Please wait before trying again.",
        code: "RATE_LIMIT_EXCEEDED",
        operation,
        retryAfter: context.retryAfter || 3600, // 1 hour default
        details: context,
      },
    };
  }

  /**
   * Handle unexpected errors
   */
  handleUnexpectedError(error, operation, context = {}) {
    const errorInfo = {
      type: "UNEXPECTED_ERROR",
      operation,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      severity: "critical",
    };

    logger.error("Unexpected error during refund operation", errorInfo);

    return {
      success: false,
      error: {
        type: "UNEXPECTED_ERROR",
        message: "An unexpected error occurred. Please contact support.",
        code: "INTERNAL_SERVER_ERROR",
        operation,
        errorId: this.generateErrorId(),
        details: {
          message: error.message,
          ...context,
        },
      },
    };
  }

  /**
   * Handle timeout errors
   */
  handleTimeoutError(operation, timeout, context = {}) {
    const errorInfo = {
      type: "TIMEOUT_ERROR",
      operation,
      timeout,
      context,
      timestamp: new Date().toISOString(),
      severity: "error",
    };

    logger.error("Operation timeout during refund processing", errorInfo);

    return {
      success: false,
      error: {
        type: "TIMEOUT_ERROR",
        message: "Operation timed out. Please try again.",
        code: "OPERATION_TIMEOUT",
        operation,
        timeout,
        details: context,
      },
    };
  }

  /**
   * Handle concurrent modification errors
   */
  handleConcurrencyError(refundId, context = {}) {
    const errorInfo = {
      type: "CONCURRENCY_ERROR",
      refundId,
      context,
      timestamp: new Date().toISOString(),
      severity: "warning",
    };

    logger.warn("Concurrent modification detected", errorInfo);

    return {
      success: false,
      error: {
        type: "CONCURRENCY_ERROR",
        message:
          "This refund is being processed by another user. Please refresh and try again.",
        code: "CONCURRENT_MODIFICATION",
        refundId,
        details: context,
      },
    };
  }

  /**
   * Handle configuration errors
   */
  handleConfigurationError(configType, error, context = {}) {
    const errorInfo = {
      type: "CONFIGURATION_ERROR",
      configType,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      severity: "critical",
    };

    logger.error("Configuration error affecting refund processing", errorInfo);

    return {
      success: false,
      error: {
        type: "CONFIGURATION_ERROR",
        message: "System configuration error. Please contact administrator.",
        code: "CONFIGURATION_ERROR",
        configType,
        details: context,
      },
    };
  }

  /**
   * Comprehensive error handler that routes to specific handlers
   */
  handleError(error, operation, context = {}) {
    try {
      // Determine error type and route to appropriate handler
      if (error.name === "ValidationError") {
        return this.handleValidationError(error, context);
      }

      if (error.name === "CastError" || error.name === "MongoError") {
        return this.handleDatabaseError(error, operation, context);
      }

      if (error.message?.includes("timeout")) {
        return this.handleTimeoutError(operation, error.timeout, context);
      }

      if (error.message?.includes("rate limit")) {
        return this.handleRateLimitError(context.userId, operation, context);
      }

      if (error.message?.includes("permission")) {
        return this.handlePermissionError(context.userId, operation, context);
      }

      if (error.message?.includes("business rule")) {
        return this.handleBusinessRuleError(
          context.rule || "unknown",
          error.message,
          context
        );
      }

      if (
        error.message?.includes("payment") ||
        error.message?.includes("gateway")
      ) {
        return this.handlePaymentGatewayError(error, context.refundId, context);
      }

      if (error.message?.includes("notification")) {
        return this.handleNotificationError(
          error,
          context.notificationType,
          context
        );
      }

      // Default to unexpected error
      return this.handleUnexpectedError(error, operation, context);
    } catch (handlerError) {
      // If error handling itself fails, log and return basic error
      logger.critical("Error handler failure", {
        originalError: error.message,
        handlerError: handlerError.message,
        operation,
        context,
      });

      return {
        success: false,
        error: {
          type: "CRITICAL_ERROR",
          message: "Critical system error. Please contact support immediately.",
          code: "CRITICAL_SYSTEM_ERROR",
          errorId: this.generateErrorId(),
        },
      };
    }
  }

  /**
   * Generate unique error ID for tracking
   */
  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error metrics for monitoring
   */
  logErrorMetrics(errorType, operation, duration = null) {
    const metrics = {
      errorType,
      operation,
      timestamp: new Date().toISOString(),
      duration,
    };

    logger.info("Error metrics", { metrics, type: "ERROR_METRIC" });
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      "TIMEOUT_ERROR",
      "PAYMENT_GATEWAY_ERROR",
      "DATABASE_ERROR",
      "NETWORK_ERROR",
    ];

    return retryableErrors.includes(error.type);
  }

  /**
   * Get suggested retry delay based on error type
   */
  getRetryDelay(error, attemptNumber = 1) {
    const baseDelays = {
      TIMEOUT_ERROR: 1000,
      PAYMENT_GATEWAY_ERROR: 2000,
      DATABASE_ERROR: 500,
      NETWORK_ERROR: 1000,
    };

    const baseDelay = baseDelays[error.type] || 1000;

    // Exponential backoff with jitter
    return baseDelay * Math.pow(2, attemptNumber - 1) + Math.random() * 1000;
  }

  /**
   * Create error summary for reporting
   */
  createErrorSummary(errors, timeRange = "24h") {
    const summary = {
      timeRange,
      totalErrors: errors.length,
      errorsByType: {},
      errorsByOperation: {},
      retryableErrors: 0,
      criticalErrors: 0,
      averageErrorRate: 0,
    };

    errors.forEach((error) => {
      // Count by type
      summary.errorsByType[error.type] =
        (summary.errorsByType[error.type] || 0) + 1;

      // Count by operation
      summary.errorsByOperation[error.operation] =
        (summary.errorsByOperation[error.operation] || 0) + 1;

      // Count retryable errors
      if (this.isRetryableError(error)) {
        summary.retryableErrors++;
      }

      // Count critical errors
      if (error.severity === "critical") {
        summary.criticalErrors++;
      }
    });

    return summary;
  }
}

export default new RefundErrorHandler();
